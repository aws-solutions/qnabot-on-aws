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
const { BedrockModelProviderPrototype } = require('./BedrockModelProviderPrototype');

class Anthropic extends BedrockModelProviderPrototype {
    constructor() {
        super();
        this.body = _.cloneDeep({
            max_tokens: 256,
            temperature: 0,
            top_k: 250,
            top_p: 1,
            stop_sequences: ['\n\nHuman:'],
            anthropic_version: 'bedrock-2023-05-31',
        });
    }

    setPrompt(prompt) {
        this.body.system = 'You are a helpful AI assistant.'
        this.body.messages = [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: prompt
                    }
                ]
            }
        ];
    }

    getResponseBody(response) {
        const body = this.parseResponseBody(response);
        return body.content[0].text;
    }
}
exports.Anthropic = Anthropic;
