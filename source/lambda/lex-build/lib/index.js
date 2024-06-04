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

const getUtterances = require('./utterances');
const getQidsandquestions = require('./qidsandquestions');

module.exports = async function (params) {
    const lexV1Status = process.env.STATUS_KEY;
    const promises = [];
    if (lexV1Status) {
        const utterances = await getUtterances(params);
        console.log('Starting Lex V1');
        const LexV1Bot = require('./lexv1bot');
        const lexV1 = await LexV1Bot(utterances);
        promises.push(lexV1);
    }
    console.log('Starting Lex V2');
    const qidsandquestions = await getQidsandquestions(params);
    const LexV2Bot = require('./lexv2bot');
    const lexV2 = await LexV2Bot(qidsandquestions);
    promises.push(lexV2);
    await Promise.all(promises);
    console.log('All Done');
    return 1;
};
