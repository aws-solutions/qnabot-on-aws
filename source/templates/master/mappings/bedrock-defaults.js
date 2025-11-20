/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = {
    BedrockDefaults: {
        'amazon.titan-embed-text-v1': {
            ModelID: 'amazon.titan-embed-text-v1',
            MaxTokens: 8000,
            EmbeddingsDimensions: 1536,
        },
        'amazon.titan-embed-text-v2': {
            ModelID: 'amazon.titan-embed-text-v2:0',
            MaxTokens: 8000,
            EmbeddingsDimensions: 1024,
        },
        'amazon.nova-2-multimodal-embeddings-v1': {
            ModelID: 'amazon.nova-2-multimodal-embeddings-v1:0',
            MaxTokens: 8172,
            EmbeddingsDimensions: 3072,
        },
        'cohere.embed-english-v3': {
            ModelID: 'cohere.embed-english-v3',
            MaxTokens: 512,
            EmbeddingsDimensions: 1024,
        },
        'cohere.embed-multilingual-v3': {
            ModelID: 'cohere.embed-multilingual-v3',
            MaxTokens: 512,
            EmbeddingsDimensions: 1024,
        },
        'global.cohere.embed-v4': {
            ModelID: 'global.cohere.embed-v4:0',
            MaxTokens: 128000,
            EmbeddingsDimensions: 1536,
        },
    },
};