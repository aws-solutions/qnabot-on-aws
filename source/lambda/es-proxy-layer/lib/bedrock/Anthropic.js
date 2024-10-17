/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
