/** ************************************************************************************************
 *   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
 *   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const qnabot = require('qnabot/logging');
const { BedrockModelProviderPrototype } = require('./BedrockModelProviderPrototype');

class BedrockLlm extends BedrockModelProviderPrototype {
    constructor() {
        super();
        this.body = _.cloneDeep({
            inferenceConfig: {
                maxTokens: 300,
                temperature: 0,
                topP: 1,
            }
        });
    }

    setPrompt(prompt) {
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

    setSystemPrompt(system) {
        this.body.system = [
            {
                text: system
            }
        ];
    }

    setParameters(params) {
        const inferenceKeys = ['maxTokens', 'stopSequences', 'temperature', 'topP'];
        const inferenceConfig = _.pick(params, inferenceKeys);
        if (Object.keys(inferenceConfig).length > 0) {
            this.body.inferenceConfig = { ...this.body.inferenceConfig, ...inferenceConfig };
        }

        const additionalModelRequestKeys = ['top_k'];
        const additionalModelRequestFields = _.pick(params, additionalModelRequestKeys);
        if (Object.keys(additionalModelRequestFields).length > 0) {
            this.body.additionalModelRequestFields = {
                ...this.body.additionalModelRequestFields,
                ...additionalModelRequestFields
            };
        }
    }

    setGuardrails(guardrails, query, groundingSource) {
        this.body.guardrailConfig = guardrails;
        this.body.guardrailConfig.trace = 'enabled';
        
        // Add guardContent entries to the existing content array
        this.body.messages[0].content.push(
            {
                guardContent: {
                    text: { 
                        text: query,
                        qualifiers: ["query"]
                    }
                }
            },
            {
                guardContent: {
                    text: { 
                        text: groundingSource,
                        qualifiers: ["grounding_source"]
                    }
                }
            }
        );
    }
    
}
exports.BedrockLlm = BedrockLlm;
