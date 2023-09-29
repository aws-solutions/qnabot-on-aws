/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

/* eslint-disable no-underscore-dangle */
const _ = require('lodash');
const qnabot = require('qnabot/logging');
const translate = require('../translate');
const llm = require('../llm');
const { mergeNext } = require('./mergeNext');
const { updateResWithHit } = require('./updateResWithHit');
const { getHit } = require('./getHit');
const { evaluateConditionalChaining } = require('./evaluateConditionalChaining');

function isQidQuery(req) {
    return req.question.toLowerCase().startsWith('qid::') || !!_.get(req, 'qid');
}

async function executeConditionalChaining(hit, req, res) {
    let c = 0;
    let errors = [];
    while (_.get(hit, 'conditionalChaining') && _.get(hit, 'elicitResponse.responsebot_hook', '') === '') {
        c++;
        // ElicitResonse is not involved and this document has conditionalChaining defined. Process the
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
    chatMessageHistory.addAIChatMessage(aiMessage || '<empty>');
    return llm.chatMemorySerialise(
        chatMessageHistory,
        LLM_CHAT_HISTORY_MAX_MESSAGES,
    );
}

async function getInitialHit(res, req, LLM_GENERATE_QUERY_ENABLE) {
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
    if (LLM_GENERATE_QUERY_ENABLE) {
        if (!isQidQuery(req)) {
            req = await llm.generate_query(req);
        } else {
            qnabot.debug('QID specified in query - do not generate LLM query.');
        }
    }
    return getHit(req, res);
}

async function translateResponse(hit, ENABLE_MULTI_LANGUAGE_SUPPORT, usrLang, req) {
    const autotranslate = _.get(hit, 'autotranslate', true);

    if (ENABLE_MULTI_LANGUAGE_SUPPORT) {
        if (usrLang != 'en' && autotranslate) {
            qnabot.log('Autotranslate hit to usrLang: ', usrLang);
            hit = await translate.translate_hit(hit, usrLang, req);
        } else {
            qnabot.log('Autotranslate not required.');
        }
    }
    return hit;
}

function prependDebugMsg(req, usrLang, hit, errors) {
    let original_input; let translated_input; let llm_generated_query; let
        msg;
    if (req.llm_generated_query && usrLang !== 'en') {
        original_input = _.get(req, '_event.origQuestion', 'notdefined');
        const translated_input = req.llm_generated_query.orig;
        const llm_generated_query = req.llm_generated_query.result;
        const search_string = req.llm_generated_query.concatenated;
        const { timing } = req.llm_generated_query;
        msg = `User Input: "${original_input}", Translated to: "${translated_input}", LLM generated query (${timing}): "${llm_generated_query}", Search string: "${search_string}"`;
    } else if (req.llm_generated_query) {
        original_input = req.llm_generated_query.orig;
        llm_generated_query = req.llm_generated_query.result;
        const search_string = req.llm_generated_query.concatenated;
        const { timing } = req.llm_generated_query;
        msg = `User Input: "${original_input}", LLM generated query (${timing}): "${llm_generated_query}", Search string: "${search_string}"`;
    } else if (!req.llm_generated_query && usrLang !== 'en') {
        original_input = _.get(req, '_event.origQuestion', 'notdefined');
        translated_input = req.question;
        msg = `User Input: "${original_input}", Translated to: "${translated_input}"`;
    } else {
        original_input = req.question;
        msg = `User Input: "${original_input}"`;
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

    const debug_msg = {
        a: `[${msg}] `,
        alt: {
            markdown: `*[${msg}]*  \n`,
            ssml: `<speak>${msg}</speak>`,
        },
        rp: `[${_.get(hit, 'rp')}] `,
    };
    hit = mergeNext(debug_msg, hit);
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
        LLM_GENERATE_QUERY_ENABLE,
        LLM_CHAT_HISTORY_MAX_MESSAGES,
        LLM_QA_PREFIX_MESSAGE,
        ENABLE_MULTI_LANGUAGE_SUPPORT,
        ENABLE_DEBUG_RESPONSES,
    } = req._settings;

    const usrLang = _.get(req, 'session.qnabotcontext.userLocale', 'en');

    let hit;
    const errors = [];
    let getInitialHitErrors = [];
    [req, res, hit, getInitialHitErrors] = await getInitialHit(res, req, LLM_GENERATE_QUERY_ENABLE);
    getInitialHitErrors.forEach((e) => errors.push(e));

    if (hit) {
        let executeConditionalChainingErrors = [];
        [req, res, hit, executeConditionalChainingErrors] = await executeConditionalChaining(hit, req, res);
        executeConditionalChainingErrors.forEach((e) => errors.push(e));
        // update conversation memory in userInfo
        // (will be automatically persisted later to DynamoDB userinfo table)
        res._userInfo.chatMessageHistory = await updateChatHistory(req, LLM_CHAT_HISTORY_MAX_MESSAGES, hit.a, LLM_QA_PREFIX_MESSAGE);

        hit = await translateResponse(hit, ENABLE_MULTI_LANGUAGE_SUPPORT, usrLang, req);
    } else {
        hit = {};
        hit.a = _.get(req, '_settings.EMPTYMESSAGE', 'You stumped me!');
        hit.alt = {
            markdown: hit.a,
            ssml: `<speak>${hit.a}</speak>`,
        };
    }

    if (ENABLE_DEBUG_RESPONSES) {
        hit = prependDebugMsg(req, usrLang, hit, errors);
    }

    res = updateResWithHit(req, res, hit);

    // add session attributes for qid and no_hits - useful for Amazon Connect integration
    res.session.qnabot_qid = _.get(res.result, 'qid', '');
    res.session.qnabot_gotanswer = res.got_hits > 0;

    const event = { req, res };
    return event;
}
exports.processFulfillmentEvent = processFulfillmentEvent;
