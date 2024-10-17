/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
