/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

/* eslint-disable no-underscore-dangle */
const _ = require('lodash');
const qnabot = require('qnabot/logging');
const translate = require('../translate');
const llm = require('../llm');
const { mergeNext } = require('./mergeNext');
const { updateResWithHit } = require('./updateResWithHit');
const { getHit } = require('./getHit');
const { evaluateConditionalChaining } = require('./evaluateConditionalChaining');
const { inIgnoreUtterances } = require('./utterance');
const { utteranceIsQid } = require('./qid');
const { getSupportedLanguages } = require('../supportedLanguages');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const customSdkConfig = require('sdk-config/customSdkConfig');

async function markConditionalChainingUsed(req) {
    const alreadyMarked = _.get(req, '_settings.CONDITIONAL_CHAINING_USED', 'false');
    if (alreadyMarked === 'true') {
        return;
    }
    
    try {
        const region = process.env.AWS_REGION || 'us-east-1';
        
        const dynamodb = new DynamoDBClient(customSdkConfig('C010', { region }));
        
        const params = {
            TableName: process.env.SETTINGS_TABLE,
            Item: {
                SettingName: { S: 'CONDITIONAL_CHAINING_USED' },
                SettingValue: { S: 'true' },
                SettingCategory: { S: 'Private' },
                DefaultValue: { S: 'false' },
                nonce: { N: '0' }
            }
        };
        
        await dynamodb.send(new PutItemCommand(params));
        
        _.set(req, '_settings.CONDITIONAL_CHAINING_USED', 'true');
    } catch (err) {
        qnabot.log('Error marking conditional chaining usage:', err);
    }
}

async function executeConditionalChaining(hit, req, res) {
    let c = 0;
    let errors = [];
    while (
        _.get(hit, 'conditionalChaining')
        && _.get(hit, 'elicitResponse.responsebot_hook', '') === ''
        && _.get(hit, 'botRouting.specialty_bot', '') === ''
    ) {
        // On first iteration, mark that conditional chaining is being used
        if (c === 0) {
            await markConditionalChainingUsed(req);
        }
        
        c++;
        // ElicitResponse and SpecialtyBot is not involved and this document has conditionalChaining defined. Process the
        // conditionalChaining in this case.
        [req, res, hit, errors] = await evaluateConditionalChaining(req, res, hit, hit.conditionalChaining);
        qnabot.log('Chained doc count: ', c);
        if (c >= 10) {
            qnabot.log('Reached Max limit of 10 chained documents (safeguard to prevent infinite loops).');
            break;
        }
    }
    return [req, res, hit, errors];
}

async function updateChatHistory(req, LLM_CHAT_HISTORY_MAX_MESSAGES, message, LLM_QA_PREFIX_MESSAGE) {
    const chatMessageHistory = await llm.chatMemoryParse(
        _.get(req._userInfo, 'chatMessageHistory', '[]'),
        LLM_CHAT_HISTORY_MAX_MESSAGES,
    );
    chatMessageHistory.addUserMessage(llm.get_question(req));
    let aiMessage = message || '<empty>';
    // remove prefix message and timing debug info, if any, before storing message
    if (LLM_QA_PREFIX_MESSAGE) {
        aiMessage = aiMessage
            .replace(new RegExp(`${LLM_QA_PREFIX_MESSAGE}\\s*(\\(.*?\\))*`, 'g'), '')
            .trim();
    }
    chatMessageHistory.addAIChatMessage(aiMessage);
    return llm.chatMemorySerialise(
        chatMessageHistory,
        LLM_CHAT_HISTORY_MAX_MESSAGES,
    );
}

function shouldGenerateQuery(req) {
    const {
        LLM_GENERATE_QUERY_ENABLE,
        PROTECTED_UTTERANCES,
    } = req._settings;
    const { question } = req;

    if (utteranceIsQid(question) || !!_.get(req, 'qid')) {
        qnabot.log('QID specified in query - do not generate LLM query.');
        return false;
    }
    if (inIgnoreUtterances(question, PROTECTED_UTTERANCES)) {
        qnabot.log('Utterance is in ignore list - do not generate LLM query.');
        return false;
    }

    return LLM_GENERATE_QUERY_ENABLE;
}

async function getInitialHit(res, req) {
    const errors = [];
    const elicitResponseChainingConfig = _.get(res, 'session.qnabotcontext.elicitResponse.chainingConfig', undefined);
    const elicitResponseProgress = _.get(res, 'session.qnabotcontext.elicitResponse.progress', undefined);
    if (elicitResponseChainingConfig
        && (elicitResponseProgress === 'Fulfilled'
            || elicitResponseProgress === 'ReadyForFulfillment'
            || elicitResponseProgress === 'Close'
            || elicitResponseProgress === 'Failed')) {
        // elicitResponse is finishing up as the LexBot has fulfilled its intent.
        // we use a fakeHit with either the Bot's message or an empty string.
        const fakeHit = {};
        fakeHit.a = res.message ? res.message : '';
        return evaluateConditionalChaining(req, res, fakeHit, elicitResponseChainingConfig);
    }
    // elicitResponse is not involved. obtain the next question to serve up to the user.
    if (shouldGenerateQuery(req)) {
        try {
            const newReq = await llm.generate_query(req);
            req = newReq;
        } catch (e) {
            qnabot.warn(`[ERROR] Fatal LLM Exception, please check logs for details: ${e.message}`);
            if (!errors.includes(e)) {
                errors.push(e.message);
            };
            qnabot.log(`Error Log Errors: ${JSON.stringify(errors)}`);
        }
    }

    let getHitErrors = [];
    let hit = {};
    [req, res, hit, getHitErrors] = await getHit(req, res);
    return [req, res, hit, errors.concat(getHitErrors)];
}

async function translateResponse(hit, ENABLE_MULTI_LANGUAGE_SUPPORT, usrLang, nativeLangCode, req) {
    const autotranslate = _.get(hit, 'autotranslate', true);

    if (ENABLE_MULTI_LANGUAGE_SUPPORT) {
        if (usrLang != nativeLangCode && autotranslate) {
            qnabot.log('Native Language in the deployment does not correspond to the same language the user is speaking in, Autotranslate hit to usrLang: ', usrLang);
            hit = await translate.translate_hit(hit, usrLang, req);
            return hit;
        } 
        else {
            qnabot.log('Autotranslate not required in TranslateResponse in ProcessFulfillment');
        }
    }
    return hit;
}

function prependDebugMsg(req, usrLang, nativeLangCode, hit, errors) {
    let originalInput;
    let translatedInput;
    let msg;
    let llmQueryOutput = '';

    if (req.llm_generated_query && usrLang !== nativeLangCode) {
        originalInput = _.get(req, '_event.origQuestion', 'notdefined');
        const { orig, result, concatenated, timing } = req.llm_generated_query;
        msg = `User Input: "${originalInput}", Translated to: "${orig}", Search string: "${concatenated}"`;
        llmQueryOutput = `LLM generated query (${timing}): "${result}"`;
    } else if (req.llm_generated_query) {
        const { orig, result, concatenated, timing } = req.llm_generated_query;
        msg = `User Input: "${orig}", Search string: "${concatenated}"`;
        llmQueryOutput = `LLM generated query (${timing}): "${result}"`;
    } else if (!req.llm_generated_query && usrLang !== nativeLangCode) {
        originalInput = _.get(req, '_event.origQuestion', 'notdefined');
        translatedInput = req.question;
        msg = `User Input: "${originalInput}", Translated to: "${translatedInput}"`;
    } else {
        msg = `User Input: "${req.question}"`;
    }

    msg = qnabot.redact_text(msg);

    if (llmQueryOutput) {
        msg += ', ' + llmQueryOutput;
    }

    const qid = _.get(req, 'qid');
    if (qid) {
        msg += `, Lex Intent matched QID "${qid}"`;
    }
    if (req.debug && req.debug.length) {
        msg += JSON.stringify(req.debug, 2);
    }
    msg += `, Source: ${_.get(hit, 'answersource', 'unknown')}`;

    if (errors.length > 0) {
        msg += `, Errors: ${JSON.stringify(errors)}`;
    }

    const debugMsg = {
        a: `[${msg}] `,
        alt: {
            markdown: `*[${msg}]*  \n`,
            ssml: `<speak>${msg}</speak>`,
        },
        rp: `[${_.get(hit, 'rp')}] `,
    };
    hit = mergeNext(debugMsg, hit);
    return hit;
}

async function processFulfillmentEvent(req, res) {
    qnabot.log('Process Fulfillment Code Hook event');
    // reset chatMemoryHistory if this is a new session...
    if (_.get(res, 'session.qnabotcontext.previous') == undefined) {
        qnabot.log('New chat session - qnabotcontext is empty. Reset previous chatMemoryHistory');
        req._userInfo.chatMessageHistory = '[]';
    }

    const {
        LLM_CHAT_HISTORY_MAX_MESSAGES,
        LLM_QA_PREFIX_MESSAGE,
        ENABLE_MULTI_LANGUAGE_SUPPORT,
        ENABLE_DEBUG_RESPONSES,
    } = req._settings;

    const backupLang = _.get(req._settings, 'BACKUP_LANGUAGE', 'English');
    const languageMapping  = getSupportedLanguages();

    let usrLang = _.get(req, 'session.qnabotcontext.userLocale', languageMapping[backupLang]);
    qnabot.log('user Language in the ProcessFulfillment Lambda is: ', usrLang);

    let hit;
    const errors = [];
    let getInitialHitErrors = [];
    [req, res, hit, getInitialHitErrors] = await getInitialHit(res, req);
    getInitialHitErrors.forEach((e) => {
        if (!errors.includes(e)) {
            errors.push(e);
        };
    });

    const nativeLanguage = _.get(req._settings, 'NATIVE_LANGUAGE', 'English');
    const nativeLangCode  = languageMapping[nativeLanguage];

    if (hit) {
        let executeConditionalChainingErrors = [];
        [req, res, hit, executeConditionalChainingErrors] = await executeConditionalChaining(hit, req, res);
        executeConditionalChainingErrors.forEach((e) => {
            if (!errors.includes(e)) {
                errors.push(e);
            };
        });
        // update conversation memory in userInfo
        // (will be automatically persisted later to DynamoDB userinfo table)
        res._userInfo.chatMessageHistory = await updateChatHistory(req, LLM_CHAT_HISTORY_MAX_MESSAGES, hit.a, LLM_QA_PREFIX_MESSAGE);

        hit = await translateResponse(hit, ENABLE_MULTI_LANGUAGE_SUPPORT, usrLang, nativeLangCode, req);
    } else {
        hit = {};
        hit.a = _.get(req, '_settings.EMPTYMESSAGE', 'You stumped me!');
        hit.alt = {
            markdown: hit.a,
            ssml: `<speak>${hit.a}</speak>`,
        };
    }

    if (ENABLE_DEBUG_RESPONSES) {
        hit = prependDebugMsg(req, usrLang, nativeLangCode, hit, errors);
    }

    res = updateResWithHit(req, res, hit);

    // add session attributes for qid and no_hits - useful for Amazon Connect integration
    res.session.qnabot_qid = _.get(res.result, 'qid', '');
    res.session.qnabot_gotanswer = res.got_hits > 0;

    const event = { req, res };
    return event;
}
exports.processFulfillmentEvent = processFulfillmentEvent;
