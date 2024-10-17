/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { BedrockModelProviderPrototype } = require('./BedrockModelProviderPrototype');

class AmazonEmbeddings extends BedrockModelProviderPrototype {
    constructor() {
        super();
        this.body = {};
    }

    setPrompt(prompt) {
        this.body.inputText = prompt;
    }

    getResponseBody(response) {
        return this.parseResponseBody(response).embedding;
    }
}
exports.AmazonEmbeddings = AmazonEmbeddings;
