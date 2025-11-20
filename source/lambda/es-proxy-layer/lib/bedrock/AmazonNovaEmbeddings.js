/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { BedrockModelProviderPrototype } = require('./BedrockModelProviderPrototype');

class AmazonNovaEmbeddings extends BedrockModelProviderPrototype {
    constructor() {
        super();
        this.body = {
            taskType: 'SINGLE_EMBEDDING',
            singleEmbeddingParams: {
                embeddingPurpose: 'GENERIC_RETRIEVAL',
                text: {
                    truncationMode: 'END',
                    value: ''
                }
            }
        };
    }

    setPrompt(prompt) {
        this.body.singleEmbeddingParams.text.value = prompt;
    }

    getResponseBody(response) {
        return this.parseResponseBody(response).embeddings[0].embedding;
    }
}

exports.AmazonNovaEmbeddings = AmazonNovaEmbeddings;