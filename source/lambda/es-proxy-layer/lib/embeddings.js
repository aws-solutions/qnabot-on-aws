/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { Lambda } = require('@aws-sdk/client-lambda');
const { SageMakerRuntime } = require('@aws-sdk/client-sagemaker-runtime');
const qnabot = require('qnabot/logging');
const { truncateByNumTokens, countTokens } = require('./truncate');
const _ = require('lodash');
const region = process.env.AWS_REGION || 'us-east-1';
const customSdkConfig = require('sdk-config/customSdkConfig');
const { invokeBedrockModel } = require('./bedrock/bedrockModels');

// input/output for endpoint running HF_MODEL intfloat/e5-large-v2
// See https://huggingface.co/intfloat/e5-large-v2
// Returns embedding with 1024 dimensions
async function getEmbeddingsSm(type_q_or_a, input, settings) {
    const sm = new SageMakerRuntime(customSdkConfig('C003', { region }));
    // prefix input text with 'query:' or 'passage:' to generate suitable embeddings per https://huggingface.co/intfloat/e5-large-v2
    if (_.get(settings, 'EMBEDDINGS_QUERY_PASSAGE_PREFIX_STRINGS', true)) {
        if (type_q_or_a === 'a') {
            input = `passage: ${input}`;
        } else {
            input = `query: ${input}`;
        }
    }
    qnabot.log(`Fetch embeddings from SageMaker for type: '${type_q_or_a}' - InputText: ${input}`);
    const payload = {
        text_inputs: input,
        mode: 'embedding'
    }
    const body = JSON.stringify(payload);
    const smres = await sm.invokeEndpoint({
        EndpointName: process.env.EMBEDDINGS_SAGEMAKER_ENDPOINT,
        ContentType: 'application/json',
        Body: body,
    });
    const sm_body = JSON.parse(Buffer.from(smres.Body, 'utf-8').toString());
    return sm_body.embedding;
};

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
        inputText = truncateByNumTokens(inputText, settings.EMBEDDINGS_MAX_TOKEN_LIMIT);
    }

    const embeddings = await invokeBedrockModel(modelId, {}, inputText, {});
    qnabot.debug(`Bedrock Embeddings Response: ${embeddings}`);
    return embeddings;
};

module.exports = async function (type_q_or_a, input, settings) {
    if (settings.EMBEDDINGS_ENABLE) {
        switch (process.env.EMBEDDINGS_API) {
        case 'SAGEMAKER':
            return getEmbeddingsSm(type_q_or_a, input, settings);
        case 'LAMBDA':
            return getEmbeddingsLambda(type_q_or_a, input, settings);
        case 'BEDROCK':
            return getEmbeddingsBedrock(type_q_or_a, input, settings);
        default:
            qnabot.log('Unrecognized value for env var EMBEDDINGS_API - expected SAGEMAKER|LAMBDA|BEDROCK: ', process.env.EMBEDDINGS_API);
        }
    }
    qnabot.log('Embeddings disabled - EMBEDDINGS_ENABLE: ', settings.EMBEDDINGS_ENABLE);
};
