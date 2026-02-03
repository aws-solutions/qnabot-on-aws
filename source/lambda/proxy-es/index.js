/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const filter = (text) => {
    if (process.env.CLOUDWATCHLOGGINGDISABLED === 'true') {
        return 'cloudwatch logging disabled';
    }
    if (process.env.QNAREDACT === 'true') {
        const re = new RegExp(process.env.REDACTING_REGEX, 'g');
        return text.replace(re, 'XXXXXX');
    }
    return text;
};

require('intercept-stdout')(filter, filter);

const qnabot = require('qnabot/logging');

exports.qid = require('../../../../../../../../opt/lib/qid');
exports.logging = require('../../../../../../../../opt/lib/es-logging');
exports.cleanmetrics = require('../../../../../../../../opt/lib/cleanmetrics');
exports.utterances = require('../../../../../../../../opt/lib/utterances');
exports.handler = require('../../../../../../../../opt/lib/handler');

exports.query = async function (event, context) {
    try {
        const result = await require('./lib/query')(event.req, event.res);
        return result;
    } catch (error) {
        qnabot.error('Query error:', error);
        throw error;
    }
};
