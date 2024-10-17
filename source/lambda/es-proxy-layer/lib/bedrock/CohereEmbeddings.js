/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { BedrockModelProviderPrototype } = require('./BedrockModelProviderPrototype');

class CohereEmbeddings extends BedrockModelProviderPrototype {
    constructor() {
        super();
        this.body = {
            texts: [],
            input_type: 'search_document',
        };
    }

    setPrompt(prompt) {
        this.body.texts.push(prompt);
    }

    getResponseBody(response) {
        return this.parseResponseBody(response).embeddings[0];
    }
}
exports.CohereEmbeddings = CohereEmbeddings;
