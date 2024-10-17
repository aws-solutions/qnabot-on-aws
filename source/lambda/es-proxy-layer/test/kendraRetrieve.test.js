/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const { retrievalKendra, determineKendraLanguage } = require('../lib/kendraClient');
const { signUrl } = require('../lib/signS3URL');
const kendra = require('../lib/kendraRetrieve');

jest.mock('../lib/kendraClient');
jest.mock('../lib/signS3URL');
jest.mock('qnabot/settings');
jest.mock('qnabot/logging');

signUrl.mockImplementation((documentURI, expireSeconds) => {
    return 'www.signedurl.com';
});

const { 
    req,
    kendraRetrieveResponse,
    determineKendraLanguageResponse,
} = require('./kendraRetrieve.fixtures')

describe('kendra retrieval', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...OLD_ENV };

        retrievalKendra.mockImplementation(() => {
            return kendraRetrieveResponse;
        });
        determineKendraLanguage.mockImplementation(() => {
            return determineKendraLanguageResponse;
        });
    })

    test('formats kendra retrieve response', async () => {
        const response = await kendra.handler(req);
        expect(retrievalKendra).toBeCalledWith(
            {
                IndexId: 'kendra-index',
                PageSize: 1,
                QueryText: 'How can I publish Kindle books?',
                AttributeFilter: {
                    'EqualsTo': {
                            "Key": "_language_code",
                            "Value":{
                                "StringValue": "en",
                            },
                    },
                }
            },
            8,
            600
        );
        expect(signUrl).toBeCalledWith('https://uri.com', 300);
        expect(response.a).toContain('content');
        expect(response.a).toContain('Source Link: <span translate=no>[doc-title](www.signedurl.com)</span>');
        expect(response.alt.markdown).toContain('content');
        expect(response.alt.ssml).toBe('');
        expect(response.answersource).toBe('KENDRA RETRIEVE API');
        expect(response.debug).toStrictEqual([]);
        expect(response.hit_count).toBe(1);
        expect(response.questions).toStrictEqual([]);
        expect(response.type).toBe('text');
    });

    test('no hit condition', async () => {
        const clonedKendraRetrieveResponse = _.cloneDeep(kendraRetrieveResponse);
        clonedKendraRetrieveResponse.ResultItems = [];
        retrievalKendra.mockImplementation(() => {
            return clonedKendraRetrieveResponse;
        });
        const response = await kendra.handler(req);
        expect(retrievalKendra).toBeCalledWith(
            {
                IndexId: 'kendra-index',
                PageSize: 1,
                QueryText: 'How can I publish Kindle books?',
                AttributeFilter: {
                    'EqualsTo': {
                            "Key": "_language_code",
                            "Value":{
                                "StringValue": "en",
                            },
                    },
                }
            },
            8,
            600,
        );
        expect(signUrl).not.toBeCalled();
        expect(response).toBe(null);
    });

    test('throws error on no kendra index condition', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_INDEXES = undefined;
        process.env.KENDRA_INDEXES = undefined;
        try {
            const response = await kendra.handler(clonedReq);

        } catch (e) {
            expect(e.message).toBe('Undefined Kendra Indexes');
        }
    });

    test('with llm query disabled', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq.llm_generated_query.concatenated = false;

        const response = await kendra.handler(clonedReq);

        expect(retrievalKendra).toBeCalledWith(
            {
                IndexId: 'kendra-index',
                PageSize: 1,
                QueryText: 'How can I publish?',
                AttributeFilter: {
                    'EqualsTo': {
                            "Key": "_language_code",
                            "Value":{
                                "StringValue": "en",
                            },
                    },
                }
            },
            8,
            600,
        );
    });

    test('with signed urls disabled', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_S3_SIGNED_URLS = false;

        const response = await kendra.handler(clonedReq);

        expect(retrievalKendra).toBeCalledWith(
            {
                IndexId: 'kendra-index',
                PageSize: 1,
                QueryText: 'How can I publish Kindle books?',
                AttributeFilter: {
                    'EqualsTo': {
                            "Key": "_language_code",
                            "Value":{
                                "StringValue": "en",
                            },
                    },
                }
            },
            8,
            600,
        );
        expect(signUrl).not.toBeCalled();
        expect(response.a).toContain('Source Link: <span translate=no>[doc-title](https://uri.com)</span>');
    });

    test('max document count setting', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT = 0;

        const response = await kendra.handler(clonedReq);

        expect(retrievalKendra).toBeCalledWith(
            {
                IndexId: 'kendra-index',
                PageSize: 0,
                QueryText: 'How can I publish Kindle books?',
                AttributeFilter: {
                    'EqualsTo': {
                            "Key": "_language_code",
                            "Value":{
                                "StringValue": "en",
                            },
                    },
                }
            },
            8,
            600,
        );
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

});
