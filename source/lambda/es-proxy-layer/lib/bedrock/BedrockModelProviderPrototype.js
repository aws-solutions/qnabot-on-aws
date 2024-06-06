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

const qnabot = require('qnabot/logging');

class BedrockModelProviderPrototype {
    constructor() {
        this.body = {};
    }

    getParameters() {
        return JSON.stringify(this.body);
    }

    setParameters(params) {
        this.body = { ...this.body, ...params };
    }

    setPrompt(prompt) {
        this.body.prompt = prompt;
    }

    parseResponseBody(response) {
        try {
            return JSON.parse(Buffer.from(response.body, 'utf-8').toString());
        } catch (e) {
            qnabot.warn('EXCEPTION:', e.stack);
            throw new Error(`Exception parsing response body: ${e.message}`);
        }
    }
}
exports.BedrockModelProviderPrototype = BedrockModelProviderPrototype;
