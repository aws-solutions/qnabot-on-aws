/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const { BedrockModelProviderPrototype } = require('./BedrockModelProviderPrototype');

class AmazonLlm extends BedrockModelProviderPrototype {
    constructor() {
        super();
        this.body = _.cloneDeep({
            textGenerationConfig: {
                maxTokenCount: 256,
                stopSequences: [],
                temperature: 0,
                topP: 1,
            },
        });
    }

    setParameters(params) {
        this.body.textGenerationConfig = { ...this.body.textGenerationConfig, ...params };
    }

    setPrompt(prompt) {
        this.body.inputText = prompt;
    }

    getResponseBody(response) {
        const body = this.parseResponseBody(response);
        return body.results[0].outputText;
    }
}
exports.AmazonLlm = AmazonLlm;
