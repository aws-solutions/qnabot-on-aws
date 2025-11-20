/** ************************************************************************************************
 *   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
 *   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const qnabot = require('qnabot/logging');
const { AmazonEmbeddings } = require('./AmazonEmbeddings');
const { BedrockLlm } = require('./bedrockLLMProvider');
const { CohereEmbeddings } = require('./CohereEmbeddings');
const { AmazonNovaEmbeddings } = require('./AmazonNovaEmbeddings');
const { bedrockClient } = require('./bedrockClient');

function isEmbedding(modelId) {
    return modelId.includes('embed');
}

function getProviderClass(modelId) {
    const isEmbeddingModel = isEmbedding(modelId);

    if (isEmbeddingModel) {
        if (modelId.includes('cohere.')) {
            return new CohereEmbeddings();
        } else if (modelId.includes('amazon.nova')) {
            return new AmazonNovaEmbeddings();
        } else {
            return new AmazonEmbeddings();
        }
    } else {
        return new BedrockLlm();
    }
}

async function invokeBedrockModel(modelId, prompt, options = {}) {
    const { parameters = {}, system, guardrails = {}, streamingAttributes, query, context } = options;
    const modelProvider = getProviderClass(modelId);
    modelProvider.setParameters(parameters);
    modelProvider.setPrompt(prompt);
    if (system) {
        modelProvider.setSystemPrompt(system);
    }

    if (!isEmbedding(modelId) && Object.keys(guardrails).length > 0) {
        modelProvider.setGuardrails(guardrails, query, context);
    }
    const input = modelProvider.getParameters();
    qnabot.log(`Bedrock Model ID ${modelId} Input: ${JSON.stringify(input, null, 2)}`);

    const response = await bedrockClient(modelId, input, streamingAttributes);
    return isEmbedding(modelId) ? modelProvider.getResponseBody(response) : response;
}

exports.invokeBedrockModel = invokeBedrockModel;
exports.isEmbedding = isEmbedding;
