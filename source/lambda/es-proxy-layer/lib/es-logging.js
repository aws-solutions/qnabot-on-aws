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

// start connection
const { FirehoseClient, PutRecordCommand } = require('@aws-sdk/client-firehose');
const customSdkConfig = require('sdk-config/customSdkConfig');
const _ = require('lodash');
const region = process.env.AWS_REGION || 'us-east-1';

const qnabot = require('qnabot/logging');
const qna_settings = require('qnabot/settings');

function processKeysForRegEx(obj, re) {
    Object.keys(obj).forEach((key, index) => {
        const val = obj[key];
        if (_.isPlainObject(val)) {
            processKeysForRegEx(val, re);
        } else if (key === 'slot') {
            obj[key] = qnabot.redact_text(val);
        } else if (key === 'recentIntentSummaryView') {
            if (val) {
                processKeysForRegEx(val, re);
            }
        } else if (typeof val === 'string') {
            obj[key] = qnabot.redact_text(val);
        }
    });
}

function stringifySessionAttribues(res) {
    const sessionAttrs = _.get(res, 'session', {});
    for (const key of Object.keys(sessionAttrs)) {
        if (typeof sessionAttrs[key] !== 'string') {
            sessionAttrs[key] = JSON.stringify(sessionAttrs[key]);
        }
    }
}

module.exports = function (event, context, callback) {
    // data to send to general metrics logging
    const date = new Date();
    const now = date.toISOString();
    // need to unwrap the request and response objects we actually want from the req object
    const { req } = event;
    const { res } = event;
    const sessionAttributes = _.cloneDeep(_.get(res, 'session', {}));

    // response session attributes are logged as JSON string values to avoid
    // ES mapping errors after upgrading from previous releases.
    stringifySessionAttribues(res);

    const redactEnabled = _.get(req, '_settings.ENABLE_REDACTING');
    const redactRegex = _.get(req, '_settings.REDACTING_REGEX', '\\b\\d{4}\\b(?![-])|\\b\\d{9}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b');
    const cloudwatchLoggingDisabled = _.get(req, '_settings.DISABLE_CLOUDWATCH_LOGGING');

    qna_settings.set_environment_variables(req._settings);
    qnabot.setPIIRedactionEnvironmentVars(
        req._event.inputTranscript,
        _.get(req, '_settings.ENABLE_REDACTING_WITH_COMPREHEND', false),
        _.get(req, '_settings.REDACTING_REGEX', ''),
        _.get(req, '_settings.COMPREHEND_REDACTING_ENTITY_TYPES', ''),
        _.get(req, '_settings.COMPREHEND_REDACTING_CONFIDENCE_SCORE', 0.99),
    ).then(async () => {
        if (cloudwatchLoggingDisabled) {
            qnabot.log('RESULT', 'cloudwatch logging disabled');
        } else if (redactEnabled) {
            qnabot.log('redact enabled');
            const re = new RegExp(redactRegex, 'g');
            processKeysForRegEx(req, re);
            processKeysForRegEx(res, re);
            processKeysForRegEx(sessionAttributes, re);
            qnabot.log('RESULT', event);
        } else {
            qnabot.log('RESULT', event);
        }

        // constructing the object to be logged in OpenSearch (to visualize in OpenSearchDashboards)
        const jsonData = {
            entireRequest: req,
            entireResponse: res,
            qid: _.get(res.result, 'qid'),
            utterance: String(req.question).toLowerCase().replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/g, ''),
            answer: _.get(res, 'message'),
            topic: _.get(res.result, 't', ''),
            session: sessionAttributes,
            clientType: req._clientType,
            tags: _.get(res, 'tags', ''),
            datetime: now,
        };

        if (cloudwatchLoggingDisabled) {
            jsonData.entireRequest = undefined;
            jsonData.utterance = undefined;
            jsonData.session = undefined;
        }
        // encode to base64 string to put into firehose and
        // append new line for proper downstream kinesis processing in OpenSearchDashboards and/or athena queries over s3
        const objJsonStr = `${JSON.stringify(jsonData)}\n`;
        const firehose = new FirehoseClient(customSdkConfig('C009', { region }));

        const params = {
            DeliveryStreamName: process.env.FIREHOSE_NAME, /* required */
            Record: { /* required */
                Data: Buffer.from(objJsonStr), /* Strings will be Base-64 encoded on your behalf */ /* required */
            },
        };
        try {
            const data = await firehose.send(new PutRecordCommand(params));
            qnabot.debug(data)
        } catch (err) {
            qnabot.log('An error occurred in Firehose PutRecordCommand: ', err);
        }
    });
};
