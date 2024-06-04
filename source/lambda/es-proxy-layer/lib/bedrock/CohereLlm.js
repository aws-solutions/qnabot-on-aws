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

const { BedrockModelProviderPrototype } = require('./BedrockModelProviderPrototype');

class CohereLlm extends BedrockModelProviderPrototype {
    constructor() {
        super();
        this.body = {
            max_tokens: 100,
            temperature: 0,
            return_likelihoods: 'GENERATION',
            p: 0.01,
            k: 0,
        };
    }

    getResponseBody(response) {
        const body = this.parseResponseBody(response);
        return body.generations[0].text;
    }
}
exports.CohereLlm = CohereLlm;
