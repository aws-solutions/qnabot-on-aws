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

const _ = require('lodash');
const qnabot = require('qnabot/logging');
const qna_settings = require('qnabot/settings');
const lex = require('./lex');
const { set_multilang_env } = require('./multilanguage');
const get_sentiment = require('./sentiment');
const alexa = require('./alexa');

async function get_settings() {
    const default_jwks_param = process.env.DEFAULT_USER_POOL_JWKS_PARAM;

    qnabot.log('Getting Default JWKS URL from SSM Parameter Store: ', default_jwks_param);
    const default_jwks_url = await qna_settings.get_parameter(default_jwks_param);

    const settings = await qna_settings.getSettings();
    _.set(settings, 'DEFAULT_USER_POOL_JWKS_URL', default_jwks_url);

    qnabot.log(`Merged Settings: ${JSON.stringify(settings, null, 2)}`);
    return settings;
}

// makes best guess as to lex client type in use based on fields in req.. not perfect
function getClientType(req) {
    if (req._type == 'ALEXA') {
        return req._type;
    }
    // Try to determine which Lex client is being used based on patterns in the req - best effort attempt.
    const voiceortext = req._preferredResponseType == 'SSML' ? 'Voice' : 'Text';

    // for LexV1 channels -- check for x-amz-lex:channel-type requestAttribute
    // more information on deploying an Amazon Lex V1 Bot on a Messaging Platform: https://docs.aws.amazon.com/lex/latest/dg/example1.html

    // for LexV2 channels -- check for x-amz-lex:channels:platform requestAttribute
    // more information on deploying an Amazon Lex V2 Bot on a Messaging Platform: https://docs.aws.amazon.com/lexv2/latest/dg/deploying-messaging-platform.html

    if (
        _.get(req, '_event.requestAttributes.x-amz-lex:channel-type') == 'Slack' ||
        _.get(req, '_event.requestAttributes.x-amz-lex:channels:platform') == 'Slack'
    ) {
        return `LEX.Slack.${voiceortext}`;
    }
    if (
        _.get(req, '_event.requestAttributes.x-amz-lex:channel-type') == 'Twilio-SMS' ||
        _.get(req, '_event.requestAttributes.x-amz-lex:channels:platform') == 'Twilio'
    ) {
        return `LEX.TwilioSMS.${voiceortext}`;
    }
    if (_.get(req, '_event.requestAttributes.x-amz-lex:accept-content-types')) {
        return `LEX.AmazonConnect.${voiceortext}`;
    }
    if (_.get(req, '_event.requestAttributes.x-amz-lex:channels:platform') == 'Genesys Cloud') {
        return `LEX.GenesysCloud.${voiceortext}`;
    }
    if (/^.*-.*-\d:.*-.*-.*-.*$/.test(_.get(req, '_event.sessionId', _.get(req, '_event.userId')))) { // NOSONAR - javascript:S5852 - input is user controlled and we have a limit on the number of characters
        // sessionId (LexV2) or userId (LexV1) pattern to detect lex-web-uithrough use of cognito id as sessionId/userId: e.g. us-east-1:a8e1f7b2-b20d-441c-9698-aff8b519d8d5
        // NOSONAR TODO: add another clientType indicator for lex-web-ui?
        return `LEX.LexWebUI.${voiceortext}`;
    }
    // generic LEX client
    return `LEX.${voiceortext}`;
}

function replaceSubstrings(SEARCH_REPLACE_QUESTION_SUBSTRINGS, req) {
    qnabot.log(
        `processing user question per SEARCH_REPLACE_QUESTION_SUBSTRINGS setting:${SEARCH_REPLACE_QUESTION_SUBSTRINGS}`
    );
    let search_replace_question_substrings = {};
    try {
        search_replace_question_substrings = JSON.parse(SEARCH_REPLACE_QUESTION_SUBSTRINGS);
    } catch {
        qnabot.log(
            `Improperly formatted JSON in SEARCH_REPLACE_QUESTION_SUBSTRINGS: ${SEARCH_REPLACE_QUESTION_SUBSTRINGS}`
        );
    }
    let { question } = req;
    for (const pattern in search_replace_question_substrings) {
        const replacement = search_replace_question_substrings[pattern];
        qnabot.log(`Search/replace: '${pattern}' with '${replacement}'`);
        question = question.replace(pattern, replacement);
    }
    return question;
}

async function parseRequestByType(req) {
    let parsedReq;
    let preferredResponseType;

    switch (req._type) {
        case 'LEX':
            preferredResponseType = 'PlainText';
            // Determine preferred response message type - PlainText, or SSML
            const outputDialogMode = _.get(req, '_event.outputDialogMode') || _.get(req, '_event.inputMode');
            if (outputDialogMode === 'Voice' || outputDialogMode === 'Speech') {
                preferredResponseType = 'SSML';
            } else if (outputDialogMode === 'Text') {
                // Amazon Connect uses outputDialogMode "Text" yet indicates support for SSML using request header x-amz-lex:accept-content-types
                const contentTypes = _.get(req, '_event.requestAttributes.x-amz-lex:accept-content-types', '');
                if (contentTypes.includes('SSML')) {
                    preferredResponseType = 'SSML';
                }
            } else {
                qnabot.log('WARNING: Unrecognized value for outputDialogMode:', outputDialogMode);
            }
            parsedReq = await lex.parse(req);
            break;
        case 'ALEXA':
            preferredResponseType = 'SSML';
            parsedReq = await alexa.parse(req);
            break;
        default:
            qnabot.log('ERROR: Unrecognized request type:', req._type);
    }
    return { preferredResponseType, parsedReq };
}

module.exports = async function parse(req, res) {
    // Add QnABot settings from Parameter Store
    const settings = await get_settings();
    qna_settings.set_environment_variables(settings);
    _.set(req, '_settings', settings);

    const { SEARCH_REPLACE_QUESTION_SUBSTRINGS, ENABLE_MULTI_LANGUAGE_SUPPORT, ENABLE_SENTIMENT_SUPPORT } = settings;

    req._type = req._event.version ? 'ALEXA' : 'LEX';

    const { preferredResponseType, parsedReq } = await parseRequestByType(req);

    _.set(req, '_preferredResponseType', preferredResponseType);
    req._clientType = getClientType(req);
    Object.assign(req, parsedReq);

    // replace substrings in user's question
    qnabot.log("checking for question search/replace setting 'SEARCH_REPLACE_QUESTION_SUBSTRINGS'.");
    if (SEARCH_REPLACE_QUESTION_SUBSTRINGS) {
        req.question = replaceSubstrings(SEARCH_REPLACE_QUESTION_SUBSTRINGS, req);
    }

    // multilanguage support
    if (ENABLE_MULTI_LANGUAGE_SUPPORT) {
        req = await set_multilang_env(req);
    }
    // end of multilanguage support

    // get sentiment
    req.sentiment = 'NOT_ENABLED';
    req.sentimentScore = {};
    if (ENABLE_SENTIMENT_SUPPORT) {
        const sentiment = await get_sentiment(req.question);
        req.sentiment = sentiment.Sentiment;
        req.sentimentScore = sentiment.SentimentScore;
    }

    Object.assign(res, {
        type: 'PlainText',
        message: '',
        session: _.mapValues(_.omit(_.cloneDeep(req.session), ['appContext']), (x) => {
            try {
                return JSON.parse(x);
            } catch (e) {
                return x;
            }
        }),
        card: {
            send: false,
            title: '',
            text: '',
            url: ''
        },
        intentname: req.intentname
    });
    // ensure res.session.qnabotcontext exists
    if (!_.get(res, 'session.qnabotcontext')) {
        _.set(res, 'session.qnabotcontext', {});
    }
    return { req, res };
};
