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

exports.qid = require('../../../../../../../../opt/lib/qid');
exports.logging = require('../../../../../../../../opt/lib/es-logging');
exports.cleanmetrics = require('../../../../../../../../opt/lib/cleanmetrics');
exports.utterances = require('../../../../../../../../opt/lib/utterances');
exports.handler = require('../../../../../../../../opt/lib/handler');

exports.query = function (event, context, callback) {
    require('./lib/query')(event.req, event.res)
        .then((x) => callback(null, x))
        .catch(callback);
};
