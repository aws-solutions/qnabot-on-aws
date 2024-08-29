/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const customSdkConfig = require('sdk-config/customSdkConfig');
const qnabot = require('qnabot/logging');

const region = process.env.AWS_REGION || 'us-east-1';

const capabilityMapping = {
    'amazon.titan-text-express-v1': 'C025',
    'amazon.titan-text-lite-v1': 'C026',
    'ai21.j2-ultra-v1': 'C027',
    'ai21.j2-mid-v1': 'C028',
    'anthropic.claude-instant-v1': 'C029',
    'anthropic.claude-v2.1': 'C030',
    'anthropic.claude-3-haiku-v1': 'C031',
    'anthropic.claude-3-sonnet-v1': 'C032',
    'cohere.command-text-v14': 'C033',
    'amazon.titan-embed-text-v1': 'C037',
    'cohere.embed-english-v3': 'C038',
    'cohere.embed-multilingual-v3': 'C039',
    'meta.llama3-8b-instruct-v1': 'C041',
    'amazon.titan-text-premier-v1': 'C042',
    'amazon.titan-embed-text-v2': 'C043',
};

function isEmbedding(modelId) {
    return modelId.includes('embed');
};

async function bedrockClient(modelId, body, guardrails) {
    const invokeModelParams = {
        body,
        contentType: 'application/json',
        accept: 'application/json',
        modelId,
    };
    let llm_result;
    const configCode = capabilityMapping[modelId] || isEmbedding(modelId) ? 'C040' : 'C036';
    const client = new BedrockRuntimeClient(customSdkConfig(configCode, { region }));

    if (!isEmbedding(modelId) && guardrails.guardrailIdentifier !== '' && guardrails.guardrailVersion !== '') {
        invokeModelParams.guardrailIdentifier = guardrails.guardrailIdentifier;
        invokeModelParams.guardrailVersion = guardrails.guardrailVersion;
    };

    qnabot.log('Bedrock Invoke Model Params: ', invokeModelParams);
    try {
        const command = new InvokeModelCommand(invokeModelParams);
        llm_result = await client.send(command);
        return llm_result;
    } catch (e) {
        let message = `Bedrock ${modelId} returned ${e.name}: ${e.message.substring(0, 500)}`;
        if (e.name === 'ResourceNotFoundException') {
            message = `${message} Please retry after selecting different Bedrock model in Cloudformation stack.`;
        };
        if (e.name === 'AccessDeniedException') {
            message = `${message} Please ensure you have requested access to the LLMs in Amazon Bedrock console.`;
        };
        throw new Error(JSON.stringify({
            message,
            type: 'Error',
        }));
    }
}

exports.bedrockClient = bedrockClient;
