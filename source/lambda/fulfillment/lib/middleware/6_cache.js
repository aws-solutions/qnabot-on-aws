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

module.exports = async function cache(req, res) {
    qnabot.log('Entering Cache Middleware');
    qnabot.debug(`response:${JSON.stringify(res)}`);
    if (_.has(res, 'out.response')) {
        res.out.sessionAttributes.cachedOutput = res.out.response;
    }
    qnabot.debug(`edited response:${JSON.stringify(res)}`);
    return { req, res };
};
