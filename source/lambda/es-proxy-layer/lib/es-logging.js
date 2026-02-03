/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

// start connection
const { FirehoseClient, PutRecordCommand } = require('@aws-sdk/client-firehose');
const customSdkConfig = require('sdk-config/customSdkConfig');
const _ = require('lodash');
const region = process.env.AWS_REGION || 'us-east-1';

const qnabot = require('qnabot/logging');
const qna_settings = require('qnabot/settings');
const { processKeysForRedact } = require('./redactHelper');

function stringifySessionAttribues(res) {
    const sessionAttrs = _.get(res, 'session', {});
    for (const key of Object.keys(sessionAttrs)) {
        if (typeof sessionAttrs[key] !== 'string') {
            sessionAttrs[key] = JSON.stringify(sessionAttrs[key]);
        }
    }
}

module.exports = async function (event, context) {
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
    const redactComprehendEnabled  =_.get(req, '_settings.ENABLE_REDACTING_WITH_COMPREHEND', false);
    const cloudwatchLoggingDisabled = _.get(req, '_settings.DISABLE_CLOUDWATCH_LOGGING');

    qna_settings.set_environment_variables(req._settings);
    await qnabot.setPIIRedactionEnvironmentVars(
        req._event.inputTranscript,
        _.get(req, '_settings.ENABLE_REDACTING_WITH_COMPREHEND', false),
        _.get(req, '_settings.REDACTING_REGEX', ''),
        _.get(req, '_settings.COMPREHEND_REDACTING_ENTITY_TYPES', ''),
        _.get(req, '_settings.COMPREHEND_REDACTING_CONFIDENCE_SCORE', 0.99),
    )

    if (cloudwatchLoggingDisabled) {
        processKeysForRedact(res, false);
        qnabot.log('RESULT', 'cloudwatch logging disabled');
    } else if (redactEnabled || redactComprehendEnabled) {
        processKeysForRedact(req, true);
        processKeysForRedact(res, true);
        processKeysForRedact(sessionAttributes, true);
        qnabot.log('REDACTED RESULT', JSON.stringify(event, null, 2));
    } else {
        processKeysForRedact(req, false);
        processKeysForRedact(res, false);
        processKeysForRedact(sessionAttributes, false);
        qnabot.log('RESULT',  JSON.stringify(event, null, 2));
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
    };
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
        const res = await firehose.send(new PutRecordCommand(params));
        qnabot.debug(`Firehose Response: ${JSON.stringify(res, null, 2)}`)
    } catch (err) {
        qnabot.log('An error occurred in Firehose PutRecordCommand: ', err);
    };
};
