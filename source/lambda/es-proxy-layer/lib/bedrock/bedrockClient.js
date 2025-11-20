/** ************************************************************************************************
 *   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
 *   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const {
    BedrockRuntimeClient,
    InvokeModelCommand,
    ConverseCommand,
    ConverseStreamCommand
} = require('@aws-sdk/client-bedrock-runtime');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');
const qnabot = require('qnabot/logging');
const customSdkConfig = require('sdk-config/customSdkConfig');
const { getConnectionId } = require('../getConnectionId');
const { applyModelIdMapping } = require('./bedrockModelConstants');

const region = process.env.AWS_REGION || 'us-east-1';

// Cache for BedrockRuntimeClient instances to prevent resource exhaustion
const clientCache = new Map();

function getBedrockClient(configCode) {
    const cacheKey = `${configCode}-${region}`;

    if (!clientCache.has(cacheKey)) {
        const client = new BedrockRuntimeClient(customSdkConfig(configCode, { region }));
        clientCache.set(cacheKey, client);
    }

    return clientCache.get(cacheKey);
}

const capabilityMapping = {
    'amazon.titan-text-express-v1': 'C025',
    'amazon.titan-text-lite-v1': 'C026',
    'ai21.jamba-instruct-v1': 'C027',
    'anthropic.claude-instant-v1': 'C029',
    'anthropic.claude-v2.1': 'C030',
    'anthropic.claude-3-haiku-v1': 'C031',
    'anthropic.claude-3-sonnet-v1': 'C032',
    'cohere.command-r-plus-v1': 'C033',
    'amazon.titan-embed-text-v1': 'C037',
    'cohere.embed-english-v3': 'C038',
    'cohere.embed-multilingual-v3': 'C039',
    'meta.llama3-8b-instruct-v1': 'C041',
    'amazon.titan-text-premier-v1': 'C042',
    'amazon.titan-embed-text-v2': 'C043',
    'anthropic.claude-3.5-sonnet-v1': 'C044',
    'anthropic.claude-3.5-sonnet-v2': 'C045',
    'meta.llama3.1-405b-instruct-v1': 'C046',
    'mistral.mistral-large-2407-v1': 'C047',
    'anthropic.claude-3.5-haiku-v1': 'C048',
    'amazon.nova-micro-v1': 'C049',
    'amazon.nova-lite-v1': 'C050',
    'amazon.nova-pro-v1': 'C051'
};

function isEmbedding(modelId) {
    return modelId.includes('embed');
}

function guardrailResponse(stopReason) {
    if (stopReason === 'guardrail_intervened') {
        qnabot.log(`Bedrock Guardrail Action: INTERVENED`);
    }
}

async function bedrockClient(modelId, input, streamingAttributes) {
    const configCode = capabilityMapping[modelId] || isEmbedding(modelId) ? 'C040' : 'C036';
    const client = getBedrockClient(configCode);
    const contentType = 'application/json';
    const accept = 'application/json';

    // Apply backward compatibility mapping if available
    modelId = applyModelIdMapping(modelId);

    let command;
    try {
        if (isEmbedding(modelId)) {
            const body = JSON.stringify(input);
            command = new InvokeModelCommand({ body, contentType, accept, modelId });
            const invokeResponse = await client.send(command);
            return invokeResponse;
        } else {
            const streamingEnable =
                (streamingAttributes?.streamingEndpoint &&
                    streamingAttributes?.streamingDynamoDbTable &&
                    streamingAttributes?.sessionId) ||
                false;

            if (streamingEnable) {
                qnabot.debug('Using ConverseStream API');
                const converseStreamResponse = await converseStream(modelId, client, input, streamingAttributes);
                qnabot.log(`ConverseStream API Response: ${converseStreamResponse}`);
                return converseStreamResponse;
            } else {
                qnabot.debug('Streaming is not enabled, using Converse API');
                command = new ConverseCommand({ modelId, ...input });
                const llmResponse = await client.send(command);
                qnabot.log(`Converse API Response: ${JSON.stringify(llmResponse, null, 2)}`);
                guardrailResponse(llmResponse?.['stopReason']);
                const final = llmResponse?.output?.message?.content[0]?.text;
                return final;
            }
        }
    } catch (e) {
        qnabot.log(`Bedrock Error: ${e}`);
        let message = `Bedrock ${modelId} returned ${e.name}: ${e.message.substring(0, 500)}`;
        if (e.name === 'ResourceNotFoundException') {
            message = `${message} Please retry after selecting different Bedrock model in Cloudformation stack.`;
        }
        if (e.name === 'AccessDeniedException') {
            message = `${message} Please ensure you have requested access to the LLMs in Amazon Bedrock console.`;
        }
        throw new Error(
            JSON.stringify({
                message,
                type: 'Error'
            })
        );
    }
}

async function converseStream(modelId, client, input, streamingAttributes) {
    qnabot.log(`Found Streaming Attributes: ${JSON.stringify(streamingAttributes, null, 2)}`);
    const command = new ConverseStreamCommand({ modelId, ...input });
    const llmResponse = await client.send(command);
    qnabot.debug(`Converse Stream Response: ${JSON.stringify(llmResponse, null, 2)}`);

    const endpoint = streamingAttributes.streamingEndpoint;
    const apiClient = new ApiGatewayManagementApiClient(customSdkConfig('C052', { region, endpoint }));
    let completeMessage = '';

    const tableName = streamingAttributes.streamingDynamoDbTable;
    const sessionId = streamingAttributes.sessionId;

    const connectionId = await getConnectionId(sessionId, tableName);

    for await (const stream of llmResponse.stream) {
        if (stream?.contentBlockDelta) {
            const text = stream.contentBlockDelta.delta?.text;
            completeMessage = completeMessage + text;

            try {
                const input = {
                    Data: text,
                    ConnectionId: connectionId
                };
                const command = new PostToConnectionCommand(input);
                await apiClient.send(command);
            } catch (error) {
                qnabot.error(`${error.name}: ${error.message.substring(0, 500)} while posting to stream connection`);
            }
        }
        if (stream?.messageStop?.stopReason) {
            guardrailResponse(stream.messageStop.stopReason);
        }
    }
    return completeMessage;
}

exports.bedrockClient = bedrockClient;
