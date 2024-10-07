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
const qnabot = require('qnabot/logging');
const { invokeBedrockModel } = require('../lib/bedrock/bedrockModels');
const { mockClient } = require('aws-sdk-client-mock');
const bedRockMock = mockClient(BedrockRuntimeClient);
require('aws-sdk-client-mock-jest');

jest.mock('qnabot/settings');
jest.mock('qnabot/logging');
jest.mock('@aws-sdk/client-bedrock-runtime');

const guardrails = { 
    guardrailIdentifier: 'test_id',
    guardrailVersion: 1
};

const llmModelBodies = {
    'amazon.titan-text-express-v1': {
        textGenerationConfig: { maxTokenCount: 256, stopSequences: [], temperature: 0, topP: 1 },
        inputText: 'test prompt',
    },
    'amazon.titan-text-lite-v1': {
        textGenerationConfig: { maxTokenCount: 256, stopSequences: [], temperature: 0, topP: 1 },
        inputText: 'test prompt',
    },
    'amazon.titan-embed-text-v1': {
        inputText: 'test prompt',
    },
    'amazon.titan-embed-text-v2': {
        inputText: 'test prompt',
    },
    'amazon.titan-text-premier-v1': {
        textGenerationConfig: { maxTokenCount: 256, stopSequences: [], temperature: 0, topP: 1 },
        inputText: 'test prompt',
    },
    'ai21.j2-ultra-v1': {
        maxTokens: 200,
        temperature: 0,
        topP: 1,
        stopSequences: [],
        countPenalty: { scale: 0 },
        presencePenalty: { scale: 0 },
        frequencyPenalty: { scale: 0 },
        prompt: 'test prompt',
    },
    'ai21.j2-mid-v1': {
        maxTokens: 200,
        temperature: 0,
        topP: 1,
        stopSequences: [],
        countPenalty: { scale: 0 },
        presencePenalty: { scale: 0 },
        frequencyPenalty: { scale: 0 },
        prompt: 'test prompt',
    },
    'anthropic.claude-instant-v1': {
        max_tokens: 256,
        temperature: 0,
        top_k: 250,
        top_p: 1,
        stop_sequences: ['\n\nHuman:'],
        anthropic_version: 'bedrock-2023-05-31',
        system : 'You are a helpful AI assistant.',
        messages : [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: 'test prompt'
                    }
                ]
            }
        ],
    },
    'anthropic.claude-v2:1': {
        max_tokens: 256,
        temperature: 0,
        top_k: 250,
        top_p: 1,
        stop_sequences: ['\n\nHuman:'],
        anthropic_version: 'bedrock-2023-05-31',
        system : 'You are a helpful AI assistant.',
        messages : [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: 'test prompt'
                    }
                ]
            }
        ],
    },
    'anthropic.claude-3-sonnet-20240229-v1': {
        max_tokens: 256,
        temperature: 0,
        top_k: 250,
        top_p: 1,
        stop_sequences: ['\n\nHuman:'],
        anthropic_version: 'bedrock-2023-05-31',
        system : 'You are a helpful AI assistant.',
        messages : [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: 'test prompt'
                    }
                ]
            }
        ],
    },
    'anthropic.claude-3-5-sonnet-20240620-v1': {
        max_tokens: 256,
        temperature: 0,
        top_k: 250,
        top_p: 1,
        stop_sequences: ['\n\nHuman:'],
        anthropic_version: 'bedrock-2023-05-31',
        system : 'You are a helpful AI assistant.',
        messages : [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: 'test prompt'
                    }
                ]
            }
        ],
    },
    'anthropic.claude-3-haiku-20240307-v1': {
        max_tokens: 256,
        temperature: 0,
        top_k: 250,
        top_p: 1,
        stop_sequences: ['\n\nHuman:'],
        anthropic_version: 'bedrock-2023-05-31',
        system : 'You are a helpful AI assistant.',
        messages : [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: 'test prompt'
                    }
                ]
            }
        ],
    },
    'cohere.command-text-v14': {
        max_tokens: 100,
        temperature: 0,
        return_likelihoods: 'GENERATION',
        p: 0.01,
        k: 0,
        prompt: 'test prompt',
    },
    'meta.llama3-8b-instruct-v1': {
        max_gen_len: 512,
        temperature: 0,
        top_p: 0.9,
        prompt: 'test prompt',
    },
    'cohere.embed-english-v3': {
        texts: ['test prompt'],
        input_type: 'search_document',
    },
    'cohere.embed-multilingual-v3': {
        texts: ['test prompt'],
        input_type: 'search_document',
    },
};

const llmModelResponses = {
    'amazon.titan-embed-text-v1': {
        body: Buffer.from(
            JSON.stringify({
                embedding: 'test response',
            })
        )
    },    
    'amazon.titan-embed-text-v2': {
        body: Buffer.from(
            JSON.stringify({
                embedding: 'test response',
            })
        )
    },
    'amazon.titan-text-express-v1': {
        body: Buffer.from(
            JSON.stringify({
                results: [
                    {
                        outputText: 'test response'
                    }
                ]
            })
        )
    },
    'amazon.titan-text-lite-v1': {
        body: Buffer.from(
            JSON.stringify({
                results: [
                    {
                        outputText: 'test response'
                    }
                ]
            })
        )
    },
    'amazon.titan-text-premier-v1': {
        body: Buffer.from(
            JSON.stringify({
                results: [
                    {
                        outputText: 'test response'
                    }
                ]
            })
        )
    },
    'ai21.j2-ultra-v1': {
        body: Buffer.from(
            JSON.stringify({
                completions: [
                    {
                        data: { text: 'test response' }
                    }
                ]
            })
        )
    },
    'ai21.j2-mid-v1': {
        body: Buffer.from(
            JSON.stringify({
                completions: [
                    {
                        data: { text: 'test response' }
                    }
                ]
            })
        )
    },
    'anthropic.claude-instant-v1': {
        body: Buffer.from(
            JSON.stringify({
                content: [
                    { 
                        text: 'test response' 
                    }
                ]
            })
        )
    },
    'anthropic.claude-v2:1': {
        body: Buffer.from(
            JSON.stringify({
                content: [
                    { 
                        text: 'test response' 
                    }
                ]
            })
        )
    },
    'anthropic.claude-3-haiku-20240307-v1': {
        body: Buffer.from(
            JSON.stringify({
                content: [
                    { 
                        text: 'test response' 
                    }
                ]
            })
        )
    },
    'anthropic.claude-3-sonnet-20240229-v1': {
        body: Buffer.from(
            JSON.stringify({
                content: [
                    { 
                        text: 'test response' 
                    }
                ]
            })
        )
    },
    'anthropic.claude-3-5-sonnet-20240620-v1': {
        body: Buffer.from(
            JSON.stringify({
                content: [
                    { 
                        text: 'test response' 
                    }
                ]
            })
        )
    },
    'cohere.command-text-v14': {
        body: Buffer.from(
            JSON.stringify({
                generations: [
                    {
                        text: 'test response'
                    }
                ]
            })
        )
    },
    'meta.llama3-8b-instruct-v1': {
        body: Buffer.from(
            JSON.stringify({
                generation: 'test response'
            })
        )
    },
    'cohere.embed-english-v3': {
        body: Buffer.from(
            JSON.stringify({
                embeddings: ['test response'],
            })
        )
    },
    'cohere.embed-multilingual-v3': {
        body: Buffer.from(
            JSON.stringify({
                embeddings: ['test response'],
            })
        )
    },
};

function isEmbedding(modelId) {
    return modelId.includes('embed');
};


describe('bedrockModels', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        bedRockMock.reset();
    });

    test('invokeBedrockModel throws error if model is not supported', async () => {
        const modelId = 'anthropic.claude-v1'; // test with the model that was deprecated
        const inputText = 'test prompt';
        const textGenerationConfig = {
            maxTokenCount: 4096,
            stopSequences: [],
            temperature: 0,
            topP: 1,
        };
        const e = new Error('Could not resolve the foundation model from the provided model identifier.');
        e.name = 'ResourceNotFoundException';
        bedRockMock.on(InvokeModelCommand).rejects(e);
        const error = new Error('{\"message\":\"Bedrock anthropic.claude-v1 returned ResourceNotFoundException: Could not resolve the foundation model from the provided model identifier. Please retry after selecting different Bedrock model in Cloudformation stack.\",\"type\":\"Error\"}')
        await expect(invokeBedrockModel(modelId, textGenerationConfig, inputText, guardrails)).rejects.toThrowError(error);
    });

    test('invokeBedrockModel returns correct body', async () => {
        const prompt = 'test prompt';
        for (const modelId in llmModelBodies) {
            const expectedCall = {
                accept: 'application/json',
                body: JSON.stringify(llmModelBodies[modelId]),
                contentType: 'application/json',
                modelId,
            }

            if (!isEmbedding(modelId)) { 
                expectedCall.guardrailIdentifier = "test_id",
                expectedCall.guardrailVersion = 1
            }

            const sendMock = jest.fn().mockImplementation(() => {
                const body = llmModelResponses[modelId].body;
                return {
                    body
                };
            });
            
            BedrockRuntimeClient.mockImplementation(() => {
                return {
                    send: sendMock,
                };
            });

            const response = await invokeBedrockModel(modelId, {}, prompt, guardrails);

            expect(response).toEqual('test response');
            expect(InvokeModelCommand).toHaveBeenCalledWith(expectedCall);
            expect(sendMock).toHaveBeenCalled();
        }
    });

    test('invokeBedrockModel with parameter overrides', async () => {
        const prompt = 'test prompt';
        const modelId = 'amazon.titan-text-lite-v1';
        const params = { maxTokenCount: 1000, temperature: 0.5, topP: 0.5 };
        const expectedCall = {
            accept: 'application/json',
            body: JSON.stringify({...llmModelBodies[modelId], textGenerationConfig:{...llmModelBodies[modelId].textGenerationConfig, ...params}}),
            contentType: 'application/json',
            modelId,
            guardrailIdentifier: "test_id",
            guardrailVersion: 1,
        }
        const body = llmModelResponses[modelId].body;

        const sendMock = jest.fn().mockImplementation(() => {
            return {
                body
            };
        });
        
        BedrockRuntimeClient.mockImplementation(() => {
            return {
                send: sendMock,
            };
        });

        const response = await invokeBedrockModel(modelId, params, prompt, guardrails);
        
        expect(response).toEqual('test response');
        expect(InvokeModelCommand).toHaveBeenCalledWith(expectedCall);
        expect(sendMock).toHaveBeenCalled();
    });

    test('invokeBedrockModel with parameter overrides', async () => {
        const prompt = 'test prompt';
        const modelId = 'anthropic.claude-v2:1';
        const params = {
            max_tokens: 100,
            temperature: 0.1,
            top_k: 100,
            top_p: 0.5,
            stop_sequences: ['\nPerson:']
        };
        const expectedCall = {
            accept: 'application/json',
            body: JSON.stringify({...llmModelBodies[modelId], ...params}),
            contentType: 'application/json',
            modelId,
            guardrailIdentifier: "test_id",
            guardrailVersion: 1,
        }
        const body = llmModelResponses[modelId].body;

        const sendMock = jest.fn().mockImplementation(() => {
            return {
                body
            };
        });
        
        BedrockRuntimeClient.mockImplementation(() => {
            return {
                send: sendMock,
            };
        });

        const response = await invokeBedrockModel(modelId, params, prompt, guardrails);
        
        expect(response).toEqual('test response');
        expect(InvokeModelCommand).toHaveBeenCalledWith(expectedCall);
        expect(sendMock).toHaveBeenCalled();

    });

    test('invokeBedrockModel throws error if provider is not supported', async () => {
        const prompt = 'test prompt';
        const modelId = 'unsupported.provider';

        try {
            await invokeBedrockModel(modelId, {}, prompt, guardrails);
            expect(true).toEqual(false);
        } catch (err) {
            expect(err.message).toEqual(`Unsupported model provider: unsupported`);
        }
    });

    test('invokeBedrockModel throws error if body cannot be parsed', async () => {
        const modelId = 'amazon.titan-text-lite-v1';

        const sendMock = jest.fn().mockImplementation(() => {
            return {};
        });
        
        BedrockRuntimeClient.mockImplementation(() => {
            return {
                send: sendMock,
            };
        });

        try {
            await invokeBedrockModel(modelId, {}, guardrails);
            expect(true).toEqual(false);
        } catch (err) {
            expect(err.message).toEqual(
                `Cannot read properties of undefined (reading 'guardrailIdentifier')`
            );
        }
    });
});
