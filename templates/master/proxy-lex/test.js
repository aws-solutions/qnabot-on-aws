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

process.env.AWS_PROFILE = require('../../../config.json').profile;
process.env.AWS_DEFAULT_REGION = require('../../../config.json').region;
process.env.AWS_REGION = require('../../../config.json').region;

const { handler } = require('./handler');

module.exports = {
    get(test) {
        handler({
            fnc: 'getBots',
            params: { maxResults: 2 },
        }, {}, (err, result) => {
            console.log('error', err);
            console.log('result:', JSON.stringify(result, null, 2));
            test.ifError(err);
            test.ok(result);
            test.done();
        });
    },
};
