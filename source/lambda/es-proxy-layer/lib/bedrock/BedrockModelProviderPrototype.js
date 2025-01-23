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
        return this.body;
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
            return parsedBody;
        } catch (e) {
            qnabot.warn('EXCEPTION:', e.stack);
            throw new Error(`Exception parsing response body: ${e.message}`);
        }
    }
}
exports.BedrockModelProviderPrototype = BedrockModelProviderPrototype;
