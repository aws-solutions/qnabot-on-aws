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
