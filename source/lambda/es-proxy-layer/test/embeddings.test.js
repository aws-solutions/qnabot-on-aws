/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const _ = require('lodash');
const { Lambda } = require('@aws-sdk/client-lambda');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const qnabot = require('qnabot/logging');
const { truncateByNumTokens, countTokens } = require('../lib/truncate');
const embeddings = require('../lib/embeddings');

jest.mock('@aws-sdk/client-lambda');
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('../lib/truncate')
jest.mock('qnabot/settings');
jest.mock('qnabot/logging');

truncateByNumTokens.mockImplementation((text, numTokens) => {
    return 'truncated';

})

countTokens.mockImplementation((text) => {
    return 50;
})

const mockInvoke = jest.fn().mockImplementation(() => {
    return {
        Payload: Buffer.from(JSON.stringify({
            embedding: ['test embedding']
        }))
    }
});

Lambda.mockImplementation(() => {
    return {
        invoke: mockInvoke,
    }
});

const mockInvokeEndpoint = jest.fn().mockImplementation(() => {
    return {
        Body: Buffer.from(JSON.stringify({
            embedding: ['test embedding']
        }))

    }
});

const mockSend = jest.fn().mockImplementation(() => {
    return {
        body: Buffer.from(JSON.stringify({
            embedding: ['test embedding']
        }))
    }
});

BedrockRuntimeClient.mockImplementation(() => {
    return {
        send: mockSend,
    }
});

describe('embeddings', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...OLD_ENV };
    });

    test('bedrock', async () => {
        process.env.EMBEDDINGS_API = 'BEDROCK';
        const type_q_or_a = 'q';
        const input = 'text';
        const settings = {
            EMBEDDINGS_ENABLE: true,
            EMBEDDINGS_MAX_TOKEN_LIMIT: 100,
            EMBEDDINGS_MODEL_ID: 'amazon.titan-embed-text-v1',
            EMBEDDINGS_QUERY_PASSAGE_PREFIX_STRINGS: true,
        }

        const result = await embeddings(type_q_or_a, input, settings);
        expect(mockSend).toHaveBeenCalled();
        expect(InvokeModelCommand).toHaveBeenCalledWith({
            accept: 'application/json',
            body: JSON.stringify({inputText: 'text'}),
            contentType: 'application/json',
            modelId: 'amazon.titan-embed-text-v1',
        });
        expect(mockInvokeEndpoint).not.toHaveBeenCalled();
        expect(mockInvoke).not.toHaveBeenCalled();
        expect(result).toStrictEqual(['test embedding'])
    });

    test('bedrock - truncate tokens', async () => {
        process.env.EMBEDDINGS_API = 'BEDROCK';
        const type_q_or_a = 'q';
        const input = 'some long text string to truncate';
        const settings = {
            EMBEDDINGS_ENABLE: true,
            EMBEDDINGS_MAX_TOKEN_LIMIT: 3,
            EMBEDDINGS_MODEL_ID: 'amazon.titan-embed-text-v1',
            EMBEDDINGS_QUERY_PASSAGE_PREFIX_STRINGS: true,
        }

        const result = await embeddings(type_q_or_a, input, settings);
        expect(mockSend).toHaveBeenCalled();
        expect(InvokeModelCommand).toHaveBeenCalledWith({
            accept: 'application/json',
            body: JSON.stringify({inputText: 'truncated'}),
            contentType: 'application/json',
            modelId: 'amazon.titan-embed-text-v1',
        });
        expect(mockInvokeEndpoint).not.toHaveBeenCalled();
        expect(mockInvoke).not.toHaveBeenCalled();
        expect(result).toStrictEqual(['test embedding'])
    });

    test('lambda', async () => {
        process.env.EMBEDDINGS_API = 'LAMBDA';
        process.env.EMBEDDINGS_LAMBDA_ARN = 'test-lambda';
        const type_q_or_a = 'q';
        const input = 'text';
        const settings = {
            EMBEDDINGS_ENABLE: true,
            EMBEDDINGS_MAX_TOKEN_LIMIT: 100,
            EMBEDDINGS_MODEL_ID: 'test',
            EMBEDDINGS_QUERY_PASSAGE_PREFIX_STRINGS: true,
        }

        const result = await embeddings(type_q_or_a, input, settings);
        expect(mockInvoke).toHaveBeenCalledWith({
            FunctionName: 'test-lambda',
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify({
                inputType: 'q',
                inputText: 'text',
            })
        });
        expect(mockSend).not.toHaveBeenCalled();
        expect(mockInvokeEndpoint).not.toHaveBeenCalled();
        expect(result).toStrictEqual(['test embedding'])
    });

    test('unknown', async () => {
        process.env.EMBEDDINGS_API = 'unknown';

        const type_q_or_a = 'q';
        const input = 'text';
        const settings = {
            EMBEDDINGS_ENABLE: true,
            EMBEDDINGS_MAX_TOKEN_LIMIT: 100,
            EMBEDDINGS_MODEL_ID: 'test',
            EMBEDDINGS_QUERY_PASSAGE_PREFIX_STRINGS: true,
        }

        const result = await embeddings(type_q_or_a, input, settings);
        expect(mockInvokeEndpoint).not.toHaveBeenCalled();
        expect(mockSend).not.toHaveBeenCalled();
        expect(mockInvoke).not.toHaveBeenCalled();
        expect(result).toBe(undefined)
    });

    test('unknown', async () => {
        process.env.EMBEDDINGS_API = 'unknown';

        const type_q_or_a = 'q';
        const input = 'text';
        const settings = {
            EMBEDDINGS_ENABLE: true,
            EMBEDDINGS_MAX_TOKEN_LIMIT: 100,
            EMBEDDINGS_MODEL_ID: 'test',
            EMBEDDINGS_QUERY_PASSAGE_PREFIX_STRINGS: true,
        }

        const result = await embeddings(type_q_or_a, input, settings);
        expect(mockInvokeEndpoint).not.toHaveBeenCalled();
        expect(mockSend).not.toHaveBeenCalled();
        expect(mockInvoke).not.toHaveBeenCalled();
        expect(result).toBe(undefined)
    });

    test('disabled', async () => {
        const type_q_or_a = 'q';
        const input = 'text';
        const settings = {
            EMBEDDINGS_ENABLE: false,
            EMBEDDINGS_MAX_TOKEN_LIMIT: 100,
            EMBEDDINGS_MODEL_ID: 'test',
            EMBEDDINGS_QUERY_PASSAGE_PREFIX_STRINGS: true,
        }

        const result = await embeddings(type_q_or_a, input, settings);
        expect(mockInvokeEndpoint).not.toHaveBeenCalled();
        expect(mockSend).not.toHaveBeenCalled();
        expect(mockInvoke).not.toHaveBeenCalled();
        expect(result).toBe(undefined)
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });
});
