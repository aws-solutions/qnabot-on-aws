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

const load = require('./load');

module.exports = async function (config) {
    try {
        const body = {
            endpoint: process.env.ES_ENDPOINT,
            method: 'POST',
            path: '_search/scroll',
            body: {
                scroll: '1m',
                scroll_id: config.scroll_id,
            },
        };
        return await load(config, body);
    } catch (error) {
        console.error('An error occurred in step task: ', error);
        throw error;
    }
};
