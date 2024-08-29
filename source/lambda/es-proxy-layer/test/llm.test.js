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

const _ = require('lodash');
const { Lambda } = require('@aws-sdk/client-lambda');
const { SageMakerRuntime } = require('@aws-sdk/client-sagemaker-runtime');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { ChatMessageHistory } = require('langchain/memory');
const { TokenTextSplitter } = require('langchain/text_splitter');

const {
    clean_context,
    chatMemorySerialise,
    chatMemoryParse,
    get_question,
    generate_query,
    get_qa,
    isNoHits,
} = require('../lib/llm');

jest.mock('@aws-sdk/client-lambda');
jest.mock('@aws-sdk/client-sagemaker-runtime');
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('qnabot/settings');
jest.mock('qnabot/logging');
jest.mock('langchain/text_splitter');

const createDocumentsMock = jest.fn().mockImplementation(async (msgArray) => {
    return [{
        pageContent: 'truncated response'
    }]
});

const textSplitterMock = TokenTextSplitter.mockImplementation(() => {
    return {
        createDocuments: createDocumentsMock,
    }
});

const { 
    req,
} = require('./llm.fixtures')

describe('llm clean_context', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    test('cleans unwanted text artifacts from the provided context', async () => {
        const context = 'While I did not find an exact answer, these search results from Amazon Kendra might be helpful.\nAnswer from Amazon Kendra FAQ.\nAmazon Kendra suggested answer.\nTHIS CONTEXT SHOULD REMAIN.\nSource Link: www.url.com';
        const response = clean_context(context, req);
        expect(response).toContain('THIS CONTEXT SHOULD REMAIN.');
        expect(response).not.toContain(req._settings.ALT_SEARCH_KENDRA_ANSWER_MESSAGE);
        expect(response).not.toContain(req._settings.ALT_SEARCH_KENDRA_FAQ_MESSAGE);
        expect(response).not.toContain(req._settings.ALT_SEARCH_KENDRA_TOP_ANSWER_MESSAGE);
        expect(response).not.toContain('Source Link');
    });

    test('cleans unwanted text artifacts from the provided context with unset kendra message settings', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_ANSWER_MESSAGE = '';
        clonedReq._settings.ALT_SEARCH_KENDRA_FAQ_MESSAGE = '';
        clonedReq._settings.ALT_SEARCH_KENDRA_TOP_ANSWER_MESSAGE = '';

        const context = 'While I did not find an exact answer, these search results from Amazon Kendra might be helpful.\nAnswer from Amazon Kendra FAQ.\nAmazon Kendra suggested answer.\nTHIS CONTEXT SHOULD REMAIN.\nSource Link: www.url.com';

        const response = clean_context(context, clonedReq);

        expect(response).toContain('THIS CONTEXT SHOULD REMAIN.');
        expect(response).toContain(req._settings.ALT_SEARCH_KENDRA_ANSWER_MESSAGE);
        expect(response).toContain(req._settings.ALT_SEARCH_KENDRA_FAQ_MESSAGE);
        expect(response).toContain(req._settings.ALT_SEARCH_KENDRA_TOP_ANSWER_MESSAGE);
        expect(response).not.toContain('Source Link');
    });
});

describe('llm chatMemorySerialise', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    test('returns chat history', async () => {
        const chatMessageHistory = {
            getMessages: jest.fn().mockImplementation(() => {
                return [
                    {
                        _getType: jest.fn().mockImplementation(() => {
                            return 'human'
                        }),
                        text: 'human message',
                    },
                    {
                        _getType: jest.fn().mockImplementation(() => {
                            return 'ai'
                        }),
                        text: 'ai message',
                    },
                ]
            }),
        };

        const response = await chatMemorySerialise(chatMessageHistory);
        expect(response).toBe(JSON.stringify([
            { Human: 'human message' },
            { AI: 'ai message' },
        ]));
    });

    test('supports non-standard prefixes', async () => {
        const chatMessageHistory = {
            getMessages: jest.fn().mockImplementation(() => {
                return [
                    {
                        _getType: jest.fn().mockImplementation(() => {
                            return 'ai'
                        }),
                        text: 'ai message',
                    },
                    {
                        _getType: jest.fn().mockImplementation(() => {
                            return 'human'
                        }),
                        text: 'human message',
                    },
                    {
                        _getType: jest.fn().mockImplementation(() => {
                            return 'ai'
                        }),
                        text: 'ai message',
                    },
                ]
            }),
        };

        const response = await chatMemorySerialise(chatMessageHistory, 2, 'Employee', 'Bot');
        expect(response).toBe(JSON.stringify([
            { Employee: 'human message' },
            { Bot: 'ai message' },
        ]));
    });

    test('throws error if unsupported message type', async () => {
        const m = {
            _getType: jest.fn().mockImplementation(() => {
                return 'invalid'
            }),
            text: 'invalid',
        };
        const chatMessageHistory = {
            getMessages: jest.fn().mockImplementation(() => {
                return [m];
            }),
        };

        try {
            await chatMemorySerialise(chatMessageHistory, 2);
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
        }
    });
});

describe('llm chatMemoryParse', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
    })

    test('parses and returns instance of chat history class', async () => {
        const addUserMessageMock = jest.spyOn(ChatMessageHistory.prototype, 'addUserMessage');
        const addAIChatMessageMock = jest.spyOn(ChatMessageHistory.prototype, 'addAIChatMessage');
        const response = await chatMemoryParse(
            JSON.stringify([
                {
                    Human: 'human message',
                },
                {
                    AI: 'ai message',
                },
            ])
        );
        expect(addUserMessageMock).toHaveBeenCalledWith('human message');
        expect(addAIChatMessageMock).toHaveBeenCalledWith('ai message');
        expect(response).toBeInstanceOf(ChatMessageHistory);
    });

    test('throws error if message type is unsupported', async () => {
        
        try {
            await chatMemoryParse(
                JSON.stringify([
                    {
                        Invalid: 'invalid',
                    },
                ])
            );
            expect(true).toBe(false);
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
        }
    });
});

describe('llm get_question', () => {
    test('returns llm generated question', async () => {
        const response = get_question(req);
        expect(response).toBe('How can I publish Kindle books?');
    });
});

describe('llm generate_query', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...OLD_ENV };


    });

    test('generates query using sagemaker', async () => {
        const clonedReq = _.cloneDeep(req);
        const invokeEndpointMock = jest.fn().mockImplementation(() => {
            return {
                Body: JSON.stringify([{
                    generated_text: 'sagemaker response',
                }]),
            }
        })

        SageMakerRuntime.mockImplementation(() => {
            return {
                invokeEndpoint: invokeEndpointMock,
            };
        });

        process.env.LLM_SAGEMAKERENDPOINT = 'test'

        const response = await generate_query(clonedReq);

        expect(invokeEndpointMock).toBeCalledWith({
            Body: JSON.stringify({
                inputs: 'Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.\nChat History: \n\nFollow Up Input: How can I publish Kindle books?\nStandalone question:',
                parameters: {
                    temperature: 0.01,
                    return_full_text: false,
                    max_new_tokens: 150,
                },
            }),
            ContentType: 'application/json',
            EndpointName: 'test'
        });
        expect(response.question).toBe('How can I publish Kindle books? / sagemaker response');
        expect(response.llm_generated_query).toStrictEqual({
            concatenated: 'How can I publish Kindle books? / sagemaker response',
            orig: 'How can I publish Kindle books?',
            result: 'sagemaker response',
            timing: expect.any(String),
        });
    });

    test('cleans query from runaway answers', async () => {
        const clonedReq = _.cloneDeep(req);
        const invokeEndpointMock = jest.fn().mockImplementation(() => {
            return {
                Body: JSON.stringify([{
                    generated_text: 'question 1? question 2?',
                }]),
            }
        })

        SageMakerRuntime.mockImplementation(() => {
            return {
                invokeEndpoint: invokeEndpointMock,
            };
        });

        process.env.LLM_SAGEMAKERENDPOINT = 'test'

        const response = await generate_query(clonedReq);

        expect(response.question).toBe('How can I publish Kindle books? / question 1?');
        expect(response.llm_generated_query).toStrictEqual({
            concatenated: 'How can I publish Kindle books? / question 1?',
            orig: 'How can I publish Kindle books?',
            result: 'question 1?',
            timing: expect.any(String),
        });
    });


    test('truncates history before truncating input from max token', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_PROMPT_MAX_TOKEN_LIMIT = 100;
        clonedReq._settings.LLM_CHAT_HISTORY_MAX_MESSAGES = 50;
        clonedReq._settings.LLM_GENERATE_QUERY_MODEL_PARAMS = '';
        clonedReq._settings.LLM_GENERATE_QUERY_PROMPT_TEMPLATE = '';
        const history = new Array(50).fill({Human: 'Some very long history that will trigger truncation.'});
        clonedReq._userInfo.chatMessageHistory = JSON.stringify(history);

        const invokeEndpointMock = jest.fn().mockImplementation(() => {
            return {
                Body: JSON.stringify([{
                    generated_text: 'sagemaker response',
                }]),
            }
        })

        SageMakerRuntime.mockImplementation(() => {
            return {
                invokeEndpoint: invokeEndpointMock,
            };
        });

        process.env.LLM_SAGEMAKERENDPOINT = 'test'

        await generate_query(clonedReq);

        expect(invokeEndpointMock).toBeCalledWith({
            Body: JSON.stringify({
                inputs: '\n\nHuman: Given the following conversation and a follow up input, if the follow up input is a question please rephrase that question to be a standalone question, otherwise return the input unchanged.\n\nChat History:\ntruncated response\n\nFollow Up Input: How can I publish Kindle books?\n\nAssistant:',
                parameters: {
                    temperature: 0,
                },
            }),
            ContentType: 'application/json',
            EndpointName: 'test'
        });
    });


    test('generates query using lambda', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_API = 'LAMBDA';
        clonedReq._settings.LLM_GENERATE_QUERY_MODEL_PARAMS = '';
        const invokeMock = jest.fn().mockImplementation(() => {
            return {
                Payload: JSON.stringify({
                    generated_text: 'lambda response',
                }),
            }
        })

        Lambda.mockImplementation(() => {
            return {
                invoke: invokeMock,
            };
        });

        process.env.LLM_LAMBDA_ARN = 'test'

        const response = await generate_query(clonedReq);

        expect(invokeMock).toBeCalledWith({
            Payload: JSON.stringify({
                prompt: 'Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.\nChat History: \n\nFollow Up Input: How can I publish Kindle books?\nStandalone question:',
                parameters: {
                    temperature: 0,
                },
                settings: clonedReq._settings,
            }),
            InvocationType: 'RequestResponse',
            FunctionName: 'test'
        });
        expect(response.question).toBe('How can I publish Kindle books? / lambda response');
        expect(response.llm_generated_query).toStrictEqual({
            concatenated: 'How can I publish Kindle books? / lambda response',
            orig: 'How can I publish Kindle books?',
            result: 'lambda response',
            timing: expect.any(String),
        });
    });

    test('generates query using bedrock', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_API = 'BEDROCK';
        clonedReq._settings.LLM_MODEL_ID = 'amazon.titan-text-lite-v1';
        clonedReq._settings.LLM_GENERATE_QUERY_MODEL_PARAMS = '';
        const sendMock = jest.fn().mockImplementation(() => {
            return {
                body: Buffer.from(JSON.stringify({
                    results: [{
                        outputText: 'bedrock response',
                    }]
                }))
            }
        });

        BedrockRuntimeClient.mockImplementation(() => {
            return {
                send: sendMock,
            };
        });

        const response = await generate_query(clonedReq);

        expect(sendMock).toBeCalled();
        expect(InvokeModelCommand).toBeCalledWith({
            accept: 'application/json',
            modelId: 'amazon.titan-text-lite-v1',
            contentType: 'application/json',
            body: JSON.stringify({
                textGenerationConfig: {
                    maxTokenCount: 256,
                    stopSequences: [],
                    temperature: 0,
                    topP: 1,
                },
                inputText: 'Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.\nChat History: \n\nFollow Up Input: How can I publish Kindle books?\nStandalone question:',
            }),
        });
        expect(response.question).toBe('How can I publish Kindle books? / bedrock response');
        expect(response.llm_generated_query).toStrictEqual({
            concatenated: 'How can I publish Kindle books? / bedrock response',
            orig: 'How can I publish Kindle books?',
            result: 'bedrock response',
            timing: expect.any(String),
        });
    });

    test('throws error if llm api type is unsupported', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_API = 'INVALID';

        try {
            response = await generate_query(clonedReq);
            expect(true).toBe(false);
        } catch (e) {
            expect(e.message).toBe(`Error: Unsupported LLM_API type: INVALID`);
        }
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });
});

describe('llm get_qa', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...OLD_ENV };

    })

    test('generates response using sagemaker', async () => {
        const clonedReq = _.cloneDeep(req);
        const invokeEndpointMock = jest.fn().mockImplementation(() => {
            return {
                Body: JSON.stringify([{
                    generated_text: 'sagemaker response',
                }]),
            }
        })

        SageMakerRuntime.mockImplementation(() => {
            return {
                invokeEndpoint: invokeEndpointMock,
            };
        });

        process.env.LLM_SAGEMAKERENDPOINT = 'test'

        const response = await get_qa(clonedReq, 'test context');

        expect(invokeEndpointMock).toBeCalledWith({
            Body: JSON.stringify({
                inputs: "Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer. Write the answer in up to 5 complete sentences.\n\ntest context\n\nQuestion: How can I publish Kindle books?\nHelpful Answer:",
                parameters: {
                    temperature: 0.01,
                    return_full_text: false,
                    max_new_tokens: 150,
                },
            }),
            ContentType: 'application/json',
            EndpointName: 'test'
        });
        expect(response).toBe('sagemaker response');
    });

    test('generates query using lambda', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_API = 'LAMBDA';
        const invokeMock = jest.fn().mockImplementation(() => {
            return {
                Payload: JSON.stringify({
                    generated_text: 'lambda response',
                }),
            }
        })

        Lambda.mockImplementation(() => {
            return {
                invoke: invokeMock,
            };
        });

        process.env.LLM_LAMBDA_ARN = 'test'

        const response = await get_qa(clonedReq, 'test context');

        expect(invokeMock).toBeCalledWith({
            Payload: JSON.stringify({
                prompt: "Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer. Write the answer in up to 5 complete sentences.\n\ntest context\n\nQuestion: How can I publish Kindle books?\nHelpful Answer:",
                parameters: {
                    temperature: 0.01,
                    return_full_text: false,
                    max_new_tokens: 150,
                },
                settings: clonedReq._settings,
            }),
            InvocationType: 'RequestResponse',
            FunctionName: 'test'
        });
        expect(response).toBe('lambda response');
    });

    test('generates query using bedrock', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_API = 'BEDROCK';
        clonedReq._settings.LLM_MODEL_ID = 'anthropic.claude-3-haiku-v1';
        const sendMock = jest.fn().mockImplementation(() => {
            return {
                body: Buffer.from(JSON.stringify({
                    content: [
                        { 
                            text: 'bedrock response' 
                        }
                    ]
                }))
            }
        });

        BedrockRuntimeClient.mockImplementation(() => {
            return {
                send: sendMock,
            };
        });

        process.env.LLM_LAMBDA_ARN = 'test'

        const response = await get_qa(clonedReq, 'test context');

        expect(sendMock).toBeCalled();
        expect(InvokeModelCommand).toBeCalledWith({
            accept: 'application/json',
            modelId: 'anthropic.claude-3-haiku-v1',
            contentType: 'application/json',
            body: JSON.stringify({
                max_tokens: 256,
                temperature: 0.01,
                top_k: 250,
                top_p: 1,
                stop_sequences: ['\n\nHuman:'],
                anthropic_version: 'bedrock-2023-05-31',
                return_full_text: false,
                max_new_tokens: 150,
                system: 'You are a helpful AI assistant.',
                messages : [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: "Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer. Write the answer in up to 5 complete sentences.\n\ntest context\n\nQuestion: How can I publish Kindle books?\nHelpful Answer:"
                            }
                        ]
                    }
                ]
            }),
        });
        expect(response).toBe('bedrock response');
    });

    test('truncates context from max token', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_PROMPT_MAX_TOKEN_LIMIT = 100;
        clonedReq._settings.LLM_QA_PROMPT_TEMPLATE = '';
        const invokeEndpointMock = jest.fn().mockImplementation(() => {
            return {
                Body: JSON.stringify([{
                    generated_text: 'sagemaker response',
                }]),
            }
        })

        SageMakerRuntime.mockImplementation(() => {
            return {
                invokeEndpoint: invokeEndpointMock,
            };
        });

        process.env.LLM_SAGEMAKERENDPOINT = 'test'

        const context = 'Some very long context that will trigger truncation.'.repeat(100);

        const response = await get_qa(clonedReq, context);

        expect(textSplitterMock).toBeCalledWith({
            chunkOverlap: 0,
            chunkSize: 20,
            encodingName: 'gpt2'
        });
        expect(createDocumentsMock).toBeCalledWith([context]);
        expect(invokeEndpointMock).toBeCalledWith({
            Body: JSON.stringify({
                inputs: "\n\nHuman: You are an AI chatbot. Carefully read the following context and conversation history and then provide a short answer to question at the end. If the answer cannot be determined from the history or the context, reply saying \"Sorry, I don't know\". \n\nContext: truncated response\n\nHistory: \n\n\nHuman: How can I publish Kindle books?\n\nAssistant:",
                parameters: {
                    temperature: 0.01,
                    return_full_text: false,
                    max_new_tokens: 150,
                },
            }),
            ContentType: 'application/json',
            EndpointName: 'test'
        });
        expect(response).toBe('sagemaker response');
    });

    test('truncates history before truncating context from max token', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_PROMPT_MAX_TOKEN_LIMIT = 100;
        clonedReq._settings.LLM_CHAT_HISTORY_MAX_MESSAGES = 50;
        clonedReq._settings.LLM_QA_MODEL_PARAMS = '';
        clonedReq._settings.LLM_QA_PROMPT_TEMPLATE = "History: {history}<br><br>Context: {context}<br><br>Question: {query}<br>Helpful Answer:";
        const history = new Array(50).fill({Human: 'Some very long history that will trigger truncation.'});
        clonedReq._userInfo.chatMessageHistory = JSON.stringify(history);

        const invokeEndpointMock = jest.fn().mockImplementation(() => {
            return {
                Body: JSON.stringify([{
                    generated_text: 'sagemaker response',
                }]),
            }
        })

        SageMakerRuntime.mockImplementation(() => {
            return {
                invokeEndpoint: invokeEndpointMock,
            };
        });

        process.env.LLM_SAGEMAKERENDPOINT = 'test'

        const context = 'Some short context that will not trigger truncation.';

        const response = await get_qa(clonedReq, context);

        expect(textSplitterMock).toBeCalledWith({
            chunkOverlap: 0,
            chunkSize: 68,
            encodingName: 'gpt2'
        });
        expect(createDocumentsMock).toBeCalledWith([history.reduce((acc, msg, i) => `Human: ${msg.Human}${i === 0 ? '' : '\n'}${acc}`, '')]);
        expect(invokeEndpointMock).toBeCalledWith({
            Body: JSON.stringify({
                inputs: "History: truncated response\n\nContext: Some short context that will not trigger truncation.\n\nQuestion: How can I publish Kindle books?\nHelpful Answer:",
                parameters: {
                    temperature: 0,
                },
            }),
            ContentType: 'application/json',
            EndpointName: 'test'
        });
        expect(response).toBe('sagemaker response');
    });

    test('generates query when Bedrock guardrails are defined', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_API = 'BEDROCK';
        clonedReq._settings.LLM_MODEL_ID = 'amazon.titan-text-lite-v1';
        clonedReq._settings.LLM_GENERATE_QUERY_MODEL_PARAMS = '';
        clonedReq._settings.BEDROCK_GUARDRAIL_IDENTIFIER = 'test_id';
        clonedReq._settings.BEDROCK_GUARDRAIL_VERSION = 1;
        const sendMock = jest.fn().mockImplementation(() => {
            return {
                body: Buffer.from(JSON.stringify({
                    results: [{
                        outputText: 'bedrock response',
                    }]
                }))
            }
        });

        BedrockRuntimeClient.mockImplementation(() => {
            return {
                send: sendMock,
            };
        });

        const response = await generate_query(clonedReq);

        expect(sendMock).toBeCalled();
        expect(InvokeModelCommand).toBeCalledWith({
            accept: 'application/json',
            modelId: 'amazon.titan-text-lite-v1',
            contentType: 'application/json',
            guardrailIdentifier: "test_id",
            guardrailVersion: "1",
            body: JSON.stringify({
                textGenerationConfig: {
                    maxTokenCount: 256,
                    stopSequences: [],
                    temperature: 0,
                    topP: 1,
                },
                inputText: 'Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.\nChat History: \n\nFollow Up Input: How can I publish Kindle books?\nStandalone question:',
            }),
        });
        expect(response.question).toBe('How can I publish Kindle books? / bedrock response');
        expect(response.llm_generated_query).toStrictEqual({
            concatenated: 'How can I publish Kindle books? / bedrock response',
            orig: 'How can I publish Kindle books?',
            result: 'bedrock response',
            timing: expect.any(String),
        });
    });


    test('throws error if prompt cannot be truncated smaller than max token count', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_QA_PROMPT_TEMPLATE = 'Some very long prompt that cannot be truncated. '.repeat(100);
        clonedReq._settings.LLM_PROMPT_MAX_TOKEN_LIMIT = 10;
        const invokeEndpointMock = jest.fn().mockImplementation(() => {
            return {
                Body: JSON.stringify([{
                    generated_text: 'sagemaker response',
                }]),
            }
        })

        SageMakerRuntime.mockImplementation(() => {
            return {
                invokeEndpoint: invokeEndpointMock,
            };
        });

        process.env.LLM_SAGEMAKERENDPOINT = 'test'

        try {
            response = await get_qa(clonedReq, '');
            expect(true).toBe(false);
        } catch (e) {
            expect(e.message).toBe(`Unable to truncate prompt to be less than ${clonedReq._settings.LLM_PROMPT_MAX_TOKEN_LIMIT} tokens long. Please check your prompt template and settings.`);
        }
    });

    test('handles errors from sagemaker', async () => {
        const invokeEndpointMock = jest.fn().mockImplementation(() => {
            throw new Error('sagemaker error')
        })

        SageMakerRuntime.mockImplementation(() => {
            return {
                invokeEndpoint: invokeEndpointMock,
            };
        });

        process.env.LLM_SAGEMAKERENDPOINT = 'test'

        try {
            response = await get_qa(req, '');
            expect(true).toBe(false);
        } catch (e) {
            expect(e.message).toBe(`Sagemaker exception: sagemaker error...`);
        }
    });

    test('handles errors invoking lambda', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_API = 'LAMBDA';
        const invokeMock = jest.fn().mockImplementation(() => {
            throw new Error('lambda error')
        })

        Lambda.mockImplementation(() => {
            return {
                invoke: invokeMock,
            };
        });

        process.env.LLM_LAMBDA_ARN = 'test'

        try {
            response = await get_qa(clonedReq, '');
            expect(true).toBe(false);
        } catch (e) {
            expect(e.message).toBe(`Lambda exception: lambda error...`);
        }
    });

    test('handles errors passed from lambda', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_QA_MODEL_PARAMS = '';
        clonedReq._settings.LLM_API = 'LAMBDA';
        const invokeMock = jest.fn().mockImplementation(() => {
            return {
                Payload: JSON.stringify({
                    errorMessage: 'lambda error',
                }),
            }
        })

        Lambda.mockImplementation(() => {
            return {
                invoke: invokeMock,
            };
        });

        process.env.LLM_LAMBDA_ARN = 'test'

        try {
            response = await get_qa(clonedReq, '');
            expect(true).toBe(false);
        } catch (e) {
            expect(e.message).toBe(`Lambda exception: lambda error...`);
        }
    });

    test('handles empty payload error from lambda response', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_API = 'LAMBDA';
        const invokeMock = jest.fn().mockImplementation(() => {
            return {
                Payload: JSON.stringify({}),
            }
        })

        Lambda.mockImplementation(() => {
            return {
                invoke: invokeMock,
            };
        });

        process.env.LLM_LAMBDA_ARN = 'test'

        try {
            response = await get_qa(clonedReq, '');
            expect(true).toBe(false);
        } catch (e) {
            expect(e.message).toBe(`Lambda exception: LLM inference failed....`);
        }
    });

    test('throws error if llm api type is unsupported', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_API = 'INVALID';

        try {
            response = await get_qa(clonedReq, '');
            expect(true).toBe(false);
        } catch (e) {
            expect(e.message).toBe(`Error: Unsupported LLM_API type: INVALID`);
        }
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

});


describe('llm isNoHits', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    test('returns true if regex match', async () => {
        const req = {
            _settings: {
                LLM_QA_NO_HITS_REGEX: '(i don\'t know)',
            },
        };
        const answer = 'I don\'t know anything about that';

        const result = isNoHits(req, answer);
        expect(result).toBe(true);
    });

    test('returns false if no regex match', async () => {
        const req = {
            _settings: {
                LLM_QA_NO_HITS_REGEX: '(i don\'t know)',
            },
        };
        const answer = 'I can\'t say';

        const result = isNoHits(req, answer);
        expect(result).toBe(false);
    });

    test('uses default setting if none provided', async () => {
        const req = {
            _settings: {
                LLM_QA_NO_HITS_REGEX: '',
            },
        };
        const answer = 'I can\'t say';

        const result = isNoHits(req, answer);
        expect(result).toBe(false);
    });

});