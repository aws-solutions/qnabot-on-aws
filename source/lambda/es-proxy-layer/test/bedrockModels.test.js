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
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const qnabot = require('qnabot/logging');
const { invokeBedrockModel } = require('../lib/bedrock/bedrockModels');
const { mockClient } = require('aws-sdk-client-mock');
const bedRockMock = mockClient(BedrockRuntimeClient);
const apiMock = mockClient(ApiGatewayManagementApiClient);
const ddbMock = mockClient(DynamoDBClient);
require('aws-sdk-client-mock-jest');

jest.mock('qnabot/settings');
jest.mock('qnabot/logging');
jest.mock('@aws-sdk/client-bedrock-runtime');

const embeddingModelBodies = {
    'amazon.titan-embed-text-v1': {
        inputText: 'test prompt'
    },
    'amazon.titan-embed-text-v2': {
        inputText: 'test prompt'
    },
    'cohere.embed-english-v3': {
        texts: ['test prompt'],
        input_type: 'search_document'
    },
    'cohere.embed-multilingual-v3': {
        texts: ['test prompt'],
        input_type: 'search_document'
    }
};

const llmModelBodies = {
    'amazon.titan-text-premier-v1': {
        maxTokens: 300,
        temperature: 0,
        topP: 0.9
    },
    'ai21.jamba-instruct-v1': {
        maxTokens: 300,
        temperature: 0,
        topP: 0.9
    },
    'anthropic.claude-3-sonnet-20240229-v1:0': {
        maxTokens: 300,
        temperature: 0,
        topP: 0.9
    },
    'anthropic.claude-3-5-sonnet-20240620-v1:0': {
        maxTokens: 300,
        temperature: 0,
        topP: 0.9,
        top_k: 250
    },
    'cohere.command-r-plus-v1:0': {
        maxTokens: 300,
        temperature: 0,
        topP: 0.9
    },
    'meta.llama3-8b-instruct-v1:0': {
        maxTokens: 300,
        temperature: 0,
        topP: 0.9
    },
    'mistral.mistral-large-2407-v1:0': {
        maxTokens: 300,
        temperature: 0,
        topP: 0.9
    }
};

const embeddingModelResponses = {
    'amazon.titan-embed-text-v1': {
        body: Buffer.from(
            JSON.stringify({
                embedding: 'test response'
            })
        )
    },
    'amazon.titan-embed-text-v2': {
        body: Buffer.from(
            JSON.stringify({
                embedding: 'test response'
            })
        )
    },
    'cohere.embed-english-v3': {
        body: Buffer.from(
            JSON.stringify({
                embeddings: ['test response']
            })
        )
    },
    'cohere.embed-multilingual-v3': {
        body: Buffer.from(
            JSON.stringify({
                embeddings: ['test response']
            })
        )
    }
};

const llmModelResponse = {
    output: {
        message: {
            content: [
                {
                    type: 'text',
                    text: 'test response'
                }
            ]
        }
    }
};

describe('Invoke Bedrock Models', () => {
    beforeEach(() => {
        bedRockMock.reset();
    });

    afterEach(() => {
        jest.clearAllMocks();
        bedRockMock.restore();
    });

    test('invokeBedrockModel throws error if model is not supported', async () => {
        const modelId = 'anthropic.claude-v1'; // test with the model that was deprecated
        const input = {
            maxTokenCount: 4096,
            stopSequences: [],
            temperature: 0,
            topP: 1
        };
        const e = new Error('Could not resolve the foundation model from the provided model identifier.');
        e.name = 'ResourceNotFoundException';
        bedRockMock.on(ConverseCommand).rejects(e);
        const error = new Error(
            '{"message":"Bedrock anthropic.claude-v1 returned ResourceNotFoundException: Could not resolve the foundation model from the provided model identifier. Please retry after selecting different Bedrock model in Cloudformation stack.","type":"Error"}'
        );
        await expect(invokeBedrockModel(modelId, input)).rejects.toThrowError(error);
    });

    test('invokeBedrockModel returns correct body with Embedding models', async () => {
        const prompt = 'test prompt';
        for (const modelId in embeddingModelBodies) {
            const expectedCall = {
                accept: 'application/json',
                body: JSON.stringify(embeddingModelBodies[modelId]),
                contentType: 'application/json',
                modelId
            };

            bedRockMock.on(InvokeModelCommand).resolves(embeddingModelResponses[modelId]);

            const response = await invokeBedrockModel(modelId, prompt);

            expect(response).toEqual('test response');
            expect(InvokeModelCommand).toHaveBeenCalledWith(expectedCall);
            expect(bedRockMock).toHaveReceivedCommand(InvokeModelCommand);
        }
    });

    test('invokeBedrockModel returns correct body with LLM models when using Converse API', async () => {
        const prompt = 'test prompt';
        for (const modelId in llmModelBodies) {
            const system = 'test system';
            const expectedCall = {
                modelId,
                system: [
                    {
                        text: system
                    }
                ],
                messages: [
                    {
                        role: 'user',
                        content: [{ text: prompt, type: 'text' }]
                    }
                ],
                inferenceConfig: { maxTokens: 300, temperature: 0, topP: 1 }
            };

            bedRockMock.on(ConverseCommand).resolves(llmModelResponse);

            const response = await invokeBedrockModel(modelId, prompt, { system });
            expect(ConverseCommand).toHaveBeenCalledWith(expectedCall);
            expect(response).toEqual('test response');
            expect(bedRockMock).toHaveReceivedCommand(ConverseCommand);
        }
    });

    test('invokeBedrockModel with parameter overrides', async () => {
        const modelId = 'anthropic.claude-3-5-sonnet-20240620-v1:0';
        const parameters = {
            maxTokens: 100,
            temperature: 0.1,
            topP: 0.5,
            top_k: 100,
            stopSequences: ['Human']
        };
        const prompt = 'test prompt';
        const system = 'test system';
        const query = 'test-query';
        const context = 'test-context';
        const guardrails = {
            guardrailIdentifier: 'test_id',
            guardrailVersion: '1',
            trace: 'enabled'
        };

        const expectedCall = {
            modelId: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
            system: [
                {
                    text: system
                }
            ],
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            text: prompt,
                            type: 'text'
                        },
                        {
                            guardContent: {
                                text: {
                                    text: query,
                                    qualifiers: ['query']
                                }
                            }
                        },
                        {
                            guardContent: {
                                text: {
                                    text: context,
                                    qualifiers: ['grounding_source']
                                }
                            }
                        }
                    ]
                }
            ],
            inferenceConfig: { maxTokens: 100, temperature: 0.1, topP: 0.5, stopSequences: ['Human'] },
            additionalModelRequestFields: { top_k: 100 },
            guardrailConfig: { guardrailIdentifier: 'test_id', guardrailVersion: '1', trace: 'enabled' }
        };

        bedRockMock.on(ConverseCommand).resolves(llmModelResponse);

        const response = await invokeBedrockModel(modelId, prompt, { parameters, system, guardrails, query, context });
        expect(ConverseCommand).toHaveBeenCalledWith(expectedCall);
        expect(response).toEqual('test response');
        expect(bedRockMock).toHaveReceivedCommand(ConverseCommand);
    });

    test('invokeBedrockModel throws error if provider is not supported', async () => {
        const prompt = 'test prompt';
        const modelId = 'unsupported.provider';

        try {
            await invokeBedrockModel(modelId, prompt);
            expect(true).toEqual(false);
        } catch (err) {
            expect(err.message).toEqual(`Unsupported model provider: unsupported`);
        }
    });

    test('invokeBedrockModel throws error if body cannot be parsed', async () => {
        const modelId = 'amazon.titan-embed-text-v2';

        bedRockMock.on(InvokeModelCommand).resolves({});

        try {
            await invokeBedrockModel(modelId, null);
            expect(true).toEqual(false);
        } catch (err) {
            expect(err.message).toEqual(
                `Exception parsing response body: The first argument must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object. Received undefined`
            );
        }
    });
});

describe('Test Converse Stream', () => {
    beforeEach(() => {
        bedRockMock.reset();
        apiMock.reset();
        ddbMock.reset();
    });

    afterEach(() => {
        jest.clearAllMocks();
        bedRockMock.restore();
        apiMock.restore();
        ddbMock.restore();
    });

    test('invokeBedrockModel returns correct body with LLM models when using ConverseStream API', async () => {
        const prompt = 'test prompt';
        for (const modelId in llmModelBodies) {
            const system = 'test system';
            const streamingAttributes = {
                streamingEndpoint: 'test-endpoint',
                streamingDynamoDbTable: 'test-table',
                sessionId: 'test-sessionId'
            };

            const expectedCall = {
                modelId,
                system: [
                    {
                        text: system
                    }
                ],
                messages: [
                    {
                        role: 'user',
                        content: [{ text: prompt, type: 'text' }]
                    }
                ],
                inferenceConfig: { maxTokens: 300, temperature: 0, topP: 1 }
            };

            const generateStream = (prompt) => {
                return {
                    [Symbol.asyncIterator]() {
                        let index = 0;

                        return {
                            next: async () => {
                                if (index < prompt.length) {
                                    return { value: prompt[index++], done: false };
                                }
                                return { value: null, done: true };
                            }
                        };
                    }
                };
            };

            const converseStreamOutput = [
                {
                    contentBlockDelta: {
                        delta: {
                            text: 'test response'
                        },
                        contentBlockIndex: 0
                    }
                }
            ];

            const commandOutput = {
                stream: generateStream(converseStreamOutput),
                $metadata: {}
            };

            bedRockMock.on(ConverseStreamCommand).resolves(commandOutput);

            const mockDbResponse = {
                Item: {
                    connectionId: {
                        S: 'test-id'
                    }
                }
            };

            apiMock.on(PostToConnectionCommand).resolves({});
            ddbMock.on(GetItemCommand).resolves(mockDbResponse);

            const response = await invokeBedrockModel(modelId, prompt, { system, streamingAttributes });
            expect(ConverseStreamCommand).toHaveBeenCalledWith(expectedCall);
            expect(response).toEqual('test response');
            expect(bedRockMock).toHaveReceivedCommand(ConverseStreamCommand);
        }
    });

    test('invokeBedrockModel returns valid response if API Gateway throws error', async () => {
        const prompt = 'test prompt';
        for (const modelId in llmModelBodies) {
            const system = 'test system';
            const streamingAttributes = {
                streamingEndpoint: 'test-endpoint',
                streamingDynamoDbTable: 'test-table',
                sessionId: 'test-sessionId'
            };

            const expectedCall = {
                modelId,
                system: [
                    {
                        text: system
                    }
                ],
                messages: [
                    {
                        role: 'user',
                        content: [{ text: prompt, type: 'text' }]
                    }
                ],
                inferenceConfig: { maxTokens: 300, temperature: 0, topP: 1 }
            };

            const generateStream = (prompt) => {
                return {
                    [Symbol.asyncIterator]() {
                        let index = 0;

                        return {
                            next: async () => {
                                if (index < prompt.length) {
                                    return { value: prompt[index++], done: false };
                                }
                                return { value: null, done: true };
                            }
                        };
                    }
                };
            };

            const converseStreamOutput = [
                {
                    contentBlockDelta: {
                        delta: {
                            text: 'test response'
                        },
                        contentBlockIndex: 0
                    }
                }
            ];

            const commandOutput = {
                stream: generateStream(converseStreamOutput),
                $metadata: {}
            };

            bedRockMock.on(ConverseStreamCommand).resolves(commandOutput);

            const mockDbResponse = {
                Item: {
                    connectionId: {
                        S: 'test-id'
                    }
                }
            };

            const e = new Error('API Connection Error');

            apiMock.on(PostToConnectionCommand).rejects(e);
            ddbMock.on(GetItemCommand).resolves(mockDbResponse);

            const response = await invokeBedrockModel(modelId, prompt, { system, streamingAttributes });
            expect(ConverseStreamCommand).toHaveBeenCalledWith(expectedCall);
            expect(response).toEqual('test response');
            expect(bedRockMock).toHaveReceivedCommand(ConverseStreamCommand);
        }
    });

    test('invokeBedrockModel returns valid response if DynamoDB throws error', async () => {
        const prompt = 'test prompt';
        for (const modelId in llmModelBodies) {
            const system = 'test system';
            const streamingAttributes = {
                streamingEndpoint: 'test-endpoint',
                streamingDynamoDbTable: 'test-table',
                sessionId: 'test-sessionId'
            };

            const expectedCall = {
                modelId,
                system: [
                    {
                        text: system
                    }
                ],
                messages: [
                    {
                        role: 'user',
                        content: [{ text: prompt, type: 'text' }]
                    }
                ],
                inferenceConfig: { maxTokens: 300, temperature: 0, topP: 1 }
            };

            const generateStream = (prompt) => {
                return {
                    [Symbol.asyncIterator]() {
                        let index = 0;

                        return {
                            next: async () => {
                                if (index < prompt.length) {
                                    return { value: prompt[index++], done: false };
                                }
                                return { value: null, done: true };
                            }
                        };
                    }
                };
            };

            const converseStreamOutput = [
                {
                    contentBlockDelta: {
                        delta: {
                            text: 'test response'
                        },
                        contentBlockIndex: 0
                    }
                }
            ];

            const commandOutput = {
                stream: generateStream(converseStreamOutput),
                $metadata: {}
            };

            bedRockMock.on(ConverseStreamCommand).resolves(commandOutput);

            const e = new Error('Unexpected DB Error');
            apiMock.on(PostToConnectionCommand).resolves({});
            ddbMock.on(GetItemCommand).rejects(e);

            const response = await invokeBedrockModel(modelId, prompt, { system, streamingAttributes });
            expect(ConverseStreamCommand).toHaveBeenCalledWith(expectedCall);
            expect(response).toEqual('test response');
            expect(bedRockMock).toHaveReceivedCommand(ConverseStreamCommand);
        }
    });

    test('invokeBedrockModel returns errpr response if ConverseStream API throws error on invalid error', async () => {
        const prompt = 'test prompt';
        const system = 'test system';

        const streamingAttributes = {
            streamingEndpoint: 'test-endpoint',
            streamingDynamoDbTable: 'test-table',
            sessionId: 'test-sessionId'
        };

        const modelId = 'unsupported.provider';

        try {
            await invokeBedrockModel(modelId, prompt, { system, streamingAttributes });
            expect(true).toEqual(false);
        } catch (err) {
            expect(err.message).toEqual(`Unsupported model provider: unsupported`);
        }
    });
});
