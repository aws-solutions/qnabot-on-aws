/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { Lambda } = require('@aws-sdk/client-lambda');
const qnabot = require('qnabot/logging');
const { truncateByNumTokens, countTokens } = require('./truncate');
const _ = require('lodash');
const region = process.env.AWS_REGION || 'us-east-1';
const customSdkConfig = require('sdk-config/customSdkConfig');
const { invokeBedrockModel } = require('./bedrock/bedrockModels');

async function getEmbeddingsLambda(type_q_or_a, input, settings) {
    qnabot.log(`Fetch embeddings from Lambda for type: '${type_q_or_a}' - InputText: ${input}`);
    const lambda = new Lambda(customSdkConfig('C004', { region }));
    const lambdares = await lambda.invoke({
        FunctionName: process.env.EMBEDDINGS_LAMBDA_ARN,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ inputType: type_q_or_a, inputText: input }),
    });
    const payloadObj = Buffer.from(lambdares.Payload).toString();
    const payload = JSON.parse(payloadObj);
    return payload.embedding;
};

async function getEmbeddingsBedrock(type_q_or_a, input, settings) {
    qnabot.log(`Fetch embeddings from Bedrock for type: '${type_q_or_a}' - InputText: ${input}`);

    const modelId = settings.EMBEDDINGS_MODEL_ID;
    let inputText = input;
    if (countTokens(inputText) > settings.EMBEDDINGS_MAX_TOKEN_LIMIT) {
        qnabot.log(`Input text exceeds max token limit of ${settings.EMBEDDINGS_MAX_TOKEN_LIMIT}. Truncating...`);
        inputText = await truncateByNumTokens(inputText, settings.EMBEDDINGS_MAX_TOKEN_LIMIT);
    }

    const embeddings = await invokeBedrockModel(modelId, inputText);
    qnabot.debug(`Bedrock Embeddings Response: ${embeddings}`);
    return embeddings;
};

module.exports = async function (type_q_or_a, input, settings) {
    if (settings.EMBEDDINGS_ENABLE) {
        switch (process.env.EMBEDDINGS_API) {
        case 'LAMBDA':
            return getEmbeddingsLambda(type_q_or_a, input, settings);
        case 'BEDROCK':
            return getEmbeddingsBedrock(type_q_or_a, input, settings);
        default:
            qnabot.log('Unrecognized value for env var EMBEDDINGS_API - expected LAMBDA|BEDROCK: ', process.env.EMBEDDINGS_API);
        }
    }
    qnabot.log('Embeddings disabled - EMBEDDINGS_ENABLE: ', settings.EMBEDDINGS_ENABLE);
};
