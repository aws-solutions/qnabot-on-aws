/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const { Lambda } = require('@aws-sdk/client-lambda');
const { BedrockRuntimeClient, ConverseCommand } = require('@aws-sdk/client-bedrock-runtime');
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
        clonedReq._settings.LLM_GENERATE_QUERY_SYSTEM_PROMPT = 'test_system_prompt';
        const sendMock = jest.fn().mockImplementation(() => {
            return {
                output: {
                    message: {
                        content: [
                            {
                                type: 'text',
                                text: 'bedrock response'
                            }
                        ]
                    }
                }
            }
        });

        BedrockRuntimeClient.mockImplementation(() => {
            return {
                send: sendMock,
            };
        });

        const expectedCall = {
            modelId: 'amazon.titan-text-lite-v1' ,
            system: [
                {
                    text: 'test_system_prompt'
                }
            ], 
            messages:  [
                {
                    role: "user",
                    content: [{ text: 'Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.\nChat History: \n\nFollow Up Input: How can I publish Kindle books?\nStandalone question:',  type: "text" }],
                },
            ],
            inferenceConfig: { maxTokens: 300, temperature: 0, topP: 1 },
        };

        const response = await generate_query(clonedReq);

        expect(ConverseCommand).toBeCalledWith(expectedCall);
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

    test('generates qa using lambda', async () => {
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
                streamingAttributes: {},
            }),
            InvocationType: 'RequestResponse',
            FunctionName: 'test'
        });
        expect(response).toBe('lambda response');
    });

    test('generates qa using bedrock', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq.question = "How can I publish Kindle books?";
        clonedReq._settings.LLM_API = 'BEDROCK';
        clonedReq._settings.LLM_MODEL_ID = 'anthropic.claude-3-haiku-v1';
        clonedReq._settings.LLM_QA_MODEL_PARAMS = '{"temperature": 0.2}';
        clonedReq._settings.LLM_QA_SYSTEM_PROMPT = 'test_system_prompt';
        clonedReq._settings.BEDROCK_GUARDRAIL_IDENTIFIER = 'test_id';
        clonedReq._settings.BEDROCK_GUARDRAIL_VERSION = 1;

        const sendMock = jest.fn().mockImplementation(() => {
            return {
                output: {
                    message: {
                        content: [
                            {
                                type: 'text',
                                text: 'bedrock response'
                            }
                        ]
                    }
                }
            }
        });

        BedrockRuntimeClient.mockImplementation(() => {
            return {
                send: sendMock,
            };
        });

        const expectedCall = {
            modelId: 'anthropic.claude-3-haiku-v1' ,
            system: [
                {
                    text: 'test_system_prompt'
                }
            ], 
            messages:  [
                {
                    role: "user",
                    content: [
                        { 
                            text: "Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer. Write the answer in up to 5 complete sentences.\n\ntest context\n\nQuestion: How can I publish Kindle books?\nHelpful Answer:",
                            type: "text" 
                        },
                        {
                            guardContent: {
                                text: { 
                                    text: "How can I publish Kindle books?",
                                    qualifiers: ["query"],
                                },
                            },
                        },
                        {
                            guardContent: {
                                text: { 
                                    text: "test context",
                                    qualifiers: [ "grounding_source" ],
                                },
                            },
                        }
                    ],
                },
            ],
            inferenceConfig: { maxTokens: 300, temperature: 0.2, topP: 1 },
            guardrailConfig: {
                guardrailIdentifier: "test_id",
                guardrailVersion: '1',
                trace: 'enabled'
            }
        };

        process.env.LLM_LAMBDA_ARN = 'test'

        const response = await get_qa(clonedReq, 'test context');

        expect(ConverseCommand).toBeCalledWith(expectedCall);
        expect(response).toBe('bedrock response');
    });

    test('generates query when Bedrock guardrails are defined and system prompt is blank', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_API = 'BEDROCK';
        clonedReq._settings.LLM_MODEL_ID = 'amazon.titan-text-lite-v1';
        clonedReq._settings.LLM_GENERATE_QUERY_MODEL_PARAMS = '';
        clonedReq._settings.LLM_GENERATE_QUERY_SYSTEM_PROMPT = '';
        clonedReq._settings.BEDROCK_GUARDRAIL_IDENTIFIER = 'test_id';
        clonedReq._settings.BEDROCK_GUARDRAIL_VERSION = 1;
        const sendMock = jest.fn().mockImplementation(() => {
            return {
                output: {
                    message: {
                        content: [
                            {
                                type: 'text',
                                text: 'bedrock response'
                            }
                        ]
                    }
                }
            }
        });

        BedrockRuntimeClient.mockImplementation(() => {
            return {
                send: sendMock,
            };
        });
        const expectedCall = {
            modelId: 'amazon.titan-text-lite-v1' ,
            messages:  [
                {
                    role: "user",
                    content: [{ text: 'Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.\nChat History: \n\nFollow Up Input: How can I publish Kindle books?\nStandalone question:',  type: "text" }],
                },
            ],
            inferenceConfig: { maxTokens: 300, temperature: 0, topP: 1},
        };

        const response = await generate_query(clonedReq);

        expect(ConverseCommand).toBeCalledWith(expectedCall);
        expect(response.question).toBe('How can I publish Kindle books? / bedrock response');
        expect(response.llm_generated_query).toStrictEqual({
            concatenated: 'How can I publish Kindle books? / bedrock response',
            orig: 'How can I publish Kindle books?',
            result: 'bedrock response',
            timing: expect.any(String),
        });
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