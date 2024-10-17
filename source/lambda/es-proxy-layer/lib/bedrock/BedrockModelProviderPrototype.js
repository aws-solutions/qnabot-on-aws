/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
            const parsedBody = JSON.parse(Buffer.from(response.body, 'utf-8').toString());
            const guardRailAction = parsedBody['amazon-bedrock-guardrailAction'];
            if (guardRailAction) {
                qnabot.log(`Guardrail Action in Bedrock LLM Response: ${guardRailAction}`)
            };
            return parsedBody;
        } catch (e) {
            qnabot.warn('EXCEPTION:', e.stack);
            throw new Error(`Exception parsing response body: ${e.message}`);
        }
    }
}
exports.BedrockModelProviderPrototype = BedrockModelProviderPrototype;
