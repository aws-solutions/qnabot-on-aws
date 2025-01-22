/** ************************************************************************************************
 *   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
 *   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const qnabot = require('qnabot/logging');
const { AmazonEmbeddings } = require('./AmazonEmbeddings');
const { BedrockLlm } = require('./bedrockLLMProvider');
const { CohereEmbeddings } = require('./CohereEmbeddings');
const { bedrockClient } = require('./bedrockClient');

function getModelProvider(modelId) {
    return modelId.split('.')[0];
}

function isEmbedding(modelId) {
    return modelId.includes('embed');
}

function getProviderClass(modelId) {
    const modelProvider = getModelProvider(modelId);
    const isEmbeddingModel = isEmbedding(modelId);
    const providerMap = {
        ai21: BedrockLlm,
        amazon: isEmbeddingModel ? AmazonEmbeddings : BedrockLlm,
        anthropic: BedrockLlm,
        cohere: isEmbeddingModel ? CohereEmbeddings : BedrockLlm,
        meta: BedrockLlm,
        mistral: BedrockLlm
    };
    
    const Provider = providerMap[modelProvider];
    
    if (!Provider) {
        throw new Error(`Unsupported model provider: ${modelProvider}`);
    }
    return new Provider();
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
