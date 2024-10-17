/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const { queryKendra, determineKendraLanguage, shouldUseOriginalLanguageQuery, getKendraIndexToken } = require('../lib/kendraClient');
const kendra = require('../lib/kendra');
const { signUrls } = require('../lib/signS3URL');
const es_query = require('../lib/es_query');

jest.mock('../lib/es_query');
jest.mock('../lib/kendraClient');
jest.mock('../lib/signS3URL');
jest.mock('qnabot/settings');
jest.mock('qnabot/logging');

signUrls.mockImplementation(async (documentURI, expireSeconds) => {
    return ['www.signedurl.com'];
});

const { 
    req,
    res,
    kendraQueryResponse,
    emptyKendraResult,
    determineKendraLanguageResponse,
    shouldUseOriginalLanguageQueryResponse,
    getKendraIndexTokenResponse,
} = require('./kendra.fixtures')

describe('kendra', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...OLD_ENV };
        kendra.kendraIndexes = undefined;

        queryKendra.mockImplementation((resArray) => {
            return new Promise((resolve, reject) => {
                resArray.originalKendraIndexId = "kendra-index";
                resArray.push(kendraQueryResponse);
                resolve(kendraQueryResponse);
            })
        });
        determineKendraLanguage.mockImplementation(() => {
            
            return determineKendraLanguageResponse;
        });
        shouldUseOriginalLanguageQuery.mockImplementation(() => {
            return shouldUseOriginalLanguageQueryResponse;
        });
        
        getKendraIndexToken.mockImplementation(() => {
            return getKendraIndexTokenResponse;
        });
    
    })

    test('QUESTION_ANSWER type', async () => {
        const response = await kendra.handler({req, res});
        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), [], 8, 600, {}, {"AttributeFilter": {"EqualsTo": {"Key": "_language_code", "Value": {"StringValue": "en"}}}, "IndexId": "kendra-index", "QueryText": "How can I publish Kindle books?"});
        expect(response.a).toContain("While I did not find an exact answer, these search results from Amazon Kendra might be helpful");
        expect(response.a).toContain("Source Link: www.signedurl.com");
        expect(response.alt.markdown).toContain("Source Link: <span translate=no>[Self Publishing | Amazon Kindle Direct Publishing](www.signedurl.com)</span>");
        expect(response.alt.ssml).toBe("<speak> Publish with Kindle Direct Publishing in 3 simple steps Step 1: Prepare your manuscript and cover files Format your. </speak>");
        expect(response.answersource).toBe("KENDRA FALLBACK");
        expect(response.autotranslate).toBe(true);
        expect(response.hit_count).toBe(1);
        expect(response.type).toBe("text");
        expect(response.debug).toStrictEqual([{
            "Type": "DOCUMENT",
            "Score": "HIGH"
        }]);
        expect(response.kendra).toEqual({
            "kendraFoundAnswerCount": 0,
            "kendraFoundDocumentCount": 1,
            "maxDocuments": 1,
        });
    });

    test('kendra redirect does not use original query', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq.kendraRedirect = true;
        await kendra.handler({req: clonedReq, res});
        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), [], 8, 600, {}, {"AttributeFilter": {"EqualsTo": {"Key": "_language_code", "Value": {"StringValue": "en"}}}, "IndexId": "kendra-index", "QueryText": "How can I publish Kindle books?"});
    });

    test('has default settings', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_TOP_ANSWER_MESSAGE = '';
        clonedReq._settings.ALT_SEARCH_KENDRA_ANSWER_MESSAGE = '';
        clonedReq._settings.ALT_SEARCH_KENDRA_FAQ_MESSAGE = '';
        clonedReq._settings.ALT_SEARCH_KENDRA_TOP_ANSWER_MESSAGE = '';
        clonedReq._settings.ALT_SEARCH_KENDRA_S3_SIGNED_URLS = false;
        clonedReq._preferredResponseType = 'SSML';

        const response = await kendra.handler({req: clonedReq, res});
        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), [], 8, 600, {}, {"AttributeFilter": {"EqualsTo": {"Key": "_language_code", "Value": {"StringValue": "en"}}}, "IndexId": "kendra-index", "QueryText": "How can I publish Kindle books?"});
        expect(response.a).not.toContain("While I did not find an exact answer, these search results from Amazon Kendra might be helpful");
        expect(response.a).toContain("Source Link: https://kdp.amazon.com/publish");
    });

    test('should return cached results', async () => {
        const clonedRes = _.cloneDeep(res);
        clonedRes.kendraResultsCached = _.cloneDeep(kendraQueryResponse);

        await kendra.handler({req, res: clonedRes});
        expect(queryKendra).not.toHaveBeenCalled();
    });

    test('cached kendra result that is empty ', async () => {
        const clonedRes = _.cloneDeep(res);
        clonedRes.kendraResultsCached = _.cloneDeep(emptyKendraResult);

        await kendra.handler({req, res: clonedRes});
        expect(queryKendra).toHaveBeenCalled();
    });

    test('ANSWER type', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE = 'MEDIUM'
        clonedReq._settings.ALT_SEARCH_KENDRA_RESPONSE_TYPES = 'QUESTION_ANSWER,ANSWER'

        const response = await kendra.handler({req:clonedReq, res});

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), [], 8, 600, {}, {"AttributeFilter": {"EqualsTo": {"Key": "_language_code", "Value": {"StringValue": "en"}}}, "IndexId": "kendra-index", "QueryText": "How can I publish Kindle books?"});
        expect(response.a).toContain("While I did not find an exact answer, these search results from Amazon Kendra might be helpful");
        expect(response.a).toContain("Go to: www.kindle.com");
        expect(response.alt.markdown).toContain("Source Link: <span translate=no>[title](www.signedurl.com)</span>");
        expect(response.alt.ssml).toBe("<speak> Go to: www.kindle </speak>");
        expect(response.answersource).toBe("KENDRA FALLBACK");
        expect(response.autotranslate).toBe(true);
        expect(response.hit_count).toBe(1);
        expect(response.type).toBe("text");
        expect(response.debug).toStrictEqual([{
            "Type": "ANSWER",
            "Score": "MEDIUM"
        }]);
        expect(response.kendra).toStrictEqual({
            "kendraFoundAnswerCount": 1,
            "kendraFoundDocumentCount": 1,
            "kendraFoundDocumentCount": 0,
            "kendraIndexId": "kendra-index",
            "kendraQueryId": "503a3ae2-490e-4778-99aa-5703bf2cfe0a",
            "kendraResultId": "answer ID",
            "maxDocuments": 1,
        });
    });

    test('ANSWER type with non-overlapping highlights', async () => {
        const clonedKendraQueryResponse = _.cloneDeep(kendraQueryResponse);
        clonedKendraQueryResponse.ResultItems[1].AdditionalAttributes[0].Value.TextWithHighlightsValue.Highlights = [
            {
                'BeginOffset': 8,
                'EndOffset': 10,
                'TopAnswer': false
            },
            {
                'BeginOffset': 12,
                'EndOffset': 22,
                'TopAnswer': true
            }
        ];
        queryKendra.mockImplementation((resArray) => {
            return new Promise((resolve, reject) => {
                resArray.originalKendraIndexId = "kendra-index";
                resArray.push(clonedKendraQueryResponse);
                resolve(clonedKendraQueryResponse);
            })
        });

        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE = 'MEDIUM'
        clonedReq._settings.ALT_SEARCH_KENDRA_RESPONSE_TYPES = 'QUESTION_ANSWER,ANSWER'

        const response = await kendra.handler({req:clonedReq, res});

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), [], 8, 600, {}, {"AttributeFilter": {"EqualsTo": {"Key": "_language_code", "Value": {"StringValue": "en"}}}, "IndexId": "kendra-index", "QueryText": "How can I publish Kindle books?"});
        expect(response.a).toContain("While I did not find an exact answer, these search results from Amazon Kendra might be helpful");
        expect(response.a).toContain("Go to: www.kindle.com");
        expect(response.alt.markdown).toContain("Source Link: <span translate=no>[title](www.signedurl.com)</span>");
        expect(response.alt.ssml).toBe("<speak> Go to: www.kindle </speak>");
        expect(response.answersource).toBe("KENDRA FALLBACK");
        expect(response.autotranslate).toBe(true);
        expect(response.hit_count).toBe(1);
        expect(response.type).toBe("text");
        expect(response.debug).toStrictEqual([{
            "Type": "ANSWER",
            "Score": "MEDIUM"
        }]);
    });

    test('ANSWER type with no highlights', async () => {
        const clonedKendraQueryResponse = _.cloneDeep(kendraQueryResponse);
        clonedKendraQueryResponse.ResultItems[1].AdditionalAttributes[0].Value.TextWithHighlightsValue.Highlights = []
        queryKendra.mockImplementation((resArray) => {
            return new Promise((resolve, reject) => {
                resArray.originalKendraIndexId = "kendra-index";
                resArray.push(clonedKendraQueryResponse);
                resolve(clonedKendraQueryResponse);
            })
        });

        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE = 'MEDIUM';
        clonedReq._settings.ALT_SEARCH_KENDRA_RESPONSE_TYPES = 'QUESTION_ANSWER,ANSWER';
        clonedReq._settings.ALT_SEARCH_KENDRA_S3_SIGNED_URLS = false;

        const response = await kendra.handler({req:clonedReq, res});

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), [], 8, 600, {}, {"AttributeFilter": {"EqualsTo": {"Key": "_language_code", "Value": {"StringValue": "en"}}}, "IndexId": "kendra-index", "QueryText": "How can I publish Kindle books?"});
        expect(response.a).toContain("While I did not find an exact answer, these search results from Amazon Kendra might be helpful");
        expect(response.a).toContain("Go to: www.kindle.com");
        expect(response.alt.markdown).toContain("Source Link: <span translate=no>[title](uri)</span>");
        expect(response.alt.ssml).toBe("<speak> Go to: www.kindle </speak>");
        expect(response.answersource).toBe("KENDRA FALLBACK");
        expect(response.autotranslate).toBe(true);
        expect(response.hit_count).toBe(1);
        expect(response.type).toBe("text");
        expect(response.debug).toStrictEqual([{
            "Type": "ANSWER",
            "Score": "MEDIUM"
        }]);
        expect(response.kendra).toStrictEqual({
            "kendraFoundAnswerCount": 1,
            "kendraFoundDocumentCount": 1,
            "kendraFoundDocumentCount": 0,
            "kendraIndexId": "kendra-index",
            "kendraQueryId": "503a3ae2-490e-4778-99aa-5703bf2cfe0a",
            "kendraResultId": "answer ID",
            "maxDocuments": 1,
        });
    });

    test('QUESTION_ANSWER type with low score', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE = 'LOW'
        clonedReq._settings.ALT_SEARCH_KENDRA_RESPONSE_TYPES = 'QUESTION_ANSWER'

        const response = await kendra.handler({req:clonedReq, res});

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), [], 8, 600, {}, {"AttributeFilter": {"EqualsTo": {"Key": "_language_code", "Value": {"StringValue": "en"}}}, "IndexId": "kendra-index", "QueryText": "How can I publish Kindle books?"});
        expect(response.a).toContain("Answer from Amazon Kendra FAQ.");
        expect(response.a).toContain("QA answer");
        expect(response.alt.markdown).toContain("**QA **answer");
        expect(response.alt.ssml).toBe("<speak> Answer from Amazon Kendra FAQ </speak>");
        expect(response.answersource).toBe("KENDRA FALLBACK");
        expect(response.autotranslate).toBe(true);
        expect(response.hit_count).toBe(1);
        expect(response.type).toBe("text");
        expect(response.debug).toStrictEqual([{
            "Type": "QUESTION_ANSWER",
            "Score": "LOW"
        }]);
        expect(response.kendra).toStrictEqual({
            "kendraFoundAnswerCount": 1,
            "kendraFoundDocumentCount": 0,
            "kendraIndexId": "kendra-index",
            "kendraQueryId": "503a3ae2-490e-4778-99aa-5703bf2cfe0a",
            "kendraResultId": "QA ID",
            "maxDocuments": 1,
        });
    });

    test('invalid type returns all results', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE = 'INVALID'
        clonedReq.llm_generated_query.concatenated = false;

        shouldUseOriginalLanguageQuery.mockImplementation(() => {
            return true;
        });
        const response = await kendra.handler({req:clonedReq, res});

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), [], 8, 600, {}, {"AttributeFilter": {"EqualsTo": {"Key": "_language_code", "Value": {"StringValue": "en"}}}, "IndexId": "kendra-index", "QueryText": "How can I publish?"});
        expect(response.answersource).toBe("KENDRA FALLBACK");
        expect(response.hit_count).toBe(4);
        expect(response.kendra).toStrictEqual({
            "kendraFoundAnswerCount": 2,
            "kendraFoundDocumentCount": 2,
            "kendraIndexId": "kendra-index",
            "kendraQueryId": "503a3ae2-490e-4778-99aa-5703bf2cfe0a",
            "kendraResultId": "QA ID",
            "maxDocuments": 1,
        });
    });

    test('invalid type returns all results', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE = 'INVALID'
        clonedReq.llm_generated_query.concatenated = false;

        shouldUseOriginalLanguageQuery.mockImplementation(() => {
            return true;
        });

        const response = await kendra.handler({req:clonedReq, res});

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), [], 8, 600, {}, {"AttributeFilter": {"EqualsTo": {"Key": "_language_code", "Value": {"StringValue": "en"}}}, "IndexId": "kendra-index", "QueryText": "How can I publish?"});
        expect(response.answersource).toBe("KENDRA FALLBACK");
        expect(response.hit_count).toBe(4);
        expect(response.kendra).toStrictEqual({
            "kendraFoundAnswerCount": 2,
            "kendraFoundDocumentCount": 2,
            "kendraIndexId": "kendra-index",
            "kendraQueryId": "503a3ae2-490e-4778-99aa-5703bf2cfe0a",
            "kendraResultId": "QA ID",
            "maxDocuments": 1,
        });
    });

    test('returns top result when llm is not enabled', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE = 'LOW'
        clonedReq._settings.LLM_QA_ENABLE = false

        const response = await kendra.handler({req:clonedReq, res});

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), [], 8, 600, {}, {"AttributeFilter": {"EqualsTo": {"Key": "_language_code", "Value": {"StringValue": "en"}}}, "IndexId": "kendra-index", "QueryText": "How can I publish Kindle books?"});
        expect(response.answersource).toBe("KENDRA FALLBACK");
        expect(response.hit_count).toBe(2);
    });

    test('throws error if no indexes', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_INDEXES = undefined;
        process.KENDRA_INDEXES = undefined;

        try {
            await kendra.handler({req:clonedReq, res});
            expect(true).toBe(false); // should not get here.
        } catch(e) {
            expect(e).toBeInstanceOf(Error);
        }
    });

    test('synced from QnA Bot with no DocumentURI', async () => {
        es_query.hasJsonStructure.mockImplementation(() => {
            return true;
        });

        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE = 'LOW';
        clonedReq._settings.ALT_SEARCH_KENDRA_RESPONSE_TYPES = 'QUESTION_ANSWER';

        const response = await kendra.handler({req: clonedReq, res});

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), [], 8, 600, {}, {"AttributeFilter": {"EqualsTo": {"Key": "_language_code", "Value": {"StringValue": "en"}}}, "IndexId": "kendra-index", "QueryText": "How can I publish Kindle books?"});
        expect(response.answersource).toBe("KENDRA FALLBACK");
        expect(response.hit_count).toBe(1);
    });

    test('synced from QnA Bot with DocumentURI', async () => {
        es_query.hasJsonStructure.mockImplementation(() => {
            return true;
        });
        const clonedKendraQueryResponse = _.cloneDeep(kendraQueryResponse);
        clonedKendraQueryResponse.ResultItems[2].DocumentURI = JSON.stringify({
            _source_qid: true
        })
        queryKendra.mockImplementation((resArray) => {
            return new Promise((resolve, reject) => {
                resArray.originalKendraIndexId = "kendra-index";
                resArray.push(clonedKendraQueryResponse);
                resolve(clonedKendraQueryResponse);
            })
        });

        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE = 'LOW';
        clonedReq._settings.ALT_SEARCH_KENDRA_RESPONSE_TYPES = 'QUESTION_ANSWER';

        const response = await kendra.handler({req: clonedReq, res});

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), [], 8, 600, {}, {"AttributeFilter": {"EqualsTo": {"Key": "_language_code", "Value": {"StringValue": "en"}}}, "IndexId": "kendra-index", "QueryText": "How can I publish Kindle books?"});
        expect(response).toBe(undefined);
    });

    test('disable abbreviated ssml', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_ABBREVIATE_MESSAGE_FOR_SSML = false;
        clonedReq._settings.ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT = 0;

        const response = await kendra.handler({req: clonedReq, res});
        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), [], 8, 600, {}, {"AttributeFilter": {"EqualsTo": {"Key": "_language_code", "Value": {"StringValue": "en"}}}, "IndexId": "kendra-index", "QueryText": "How can I publish Kindle books?"});
        expect(response.a).toContain("While I did not find an exact answer, these search results from Amazon Kendra might be helpful");
        expect(response.alt.ssml).toBe("<speak> ...Publish with Kindle Direct Publishing in 3 simple steps Step 1: Prepare your manuscript and cover files Format your... </speak>");
        expect(response.answersource).toBe("KENDRA FALLBACK");
        expect(response.autotranslate).toBe(true);
        expect(response.hit_count).toBe(1);
        expect(response.type).toBe("text");
        expect(response.debug).toStrictEqual([]);
    });

    test('disable abbreviated ssml with no filtered messages', async () => {
        const clonedKendraQueryResponse = _.cloneDeep(kendraQueryResponse);
        clonedKendraQueryResponse.ResultItems = [clonedKendraQueryResponse.ResultItems[3]];
        clonedKendraQueryResponse.ResultItems[0].DocumentTitle.Text = '';
        queryKendra.mockImplementation((resArray) => {
            return new Promise((resolve, reject) => {
                resArray.originalKendraIndexId = "kendra-index";
                resArray.push(clonedKendraQueryResponse);
                resolve(clonedKendraQueryResponse);
            })
        });

        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_ABBREVIATE_MESSAGE_FOR_SSML = false;
        clonedReq._settings.ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE = 'LOW'
        clonedReq._settings.ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT = 0;

        const response = await kendra.handler({req: clonedReq, res});
        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), [], 8, 600, {}, {"AttributeFilter": {"EqualsTo": {"Key": "_language_code", "Value": {"StringValue": "en"}}}, "IndexId": "kendra-index", "QueryText": "How can I publish Kindle books?"});
        expect(response.alt.ssml).toBe("<speak> ...Publish with Kindle Direct Publishing in 3 simple steps Step 1: Prepare your manuscript and cover files Format your... </speak>");
        expect(response.alt.markdown).toContain("**While I did not find an exact answer, these search results from Amazon Kendra might be helpful.**");
    });

    test('kendra fallback with auth token enabled', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_AUTH_TOKEN = 'test-token';
        clonedReq._settings.ALT_SEARCH_KENDRA_INDEX_AUTH = true;
        clonedReq._userInfo.isVerifiedIdentity = 'true';

        getKendraIndexToken.mockImplementation(() => {
            return {
                Token: '<token redacted>',
            };
        });

        const response = await kendra.handler({ req: clonedReq, res });

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array),[], 8, 600, {"Token": "<token redacted>"}, {"AttributeFilter": {"EqualsTo": {"Key": "_language_code", "Value": {"StringValue": "en"}}}, "IndexId": "kendra-index", "QueryText": "How can I publish Kindle books?"});
    });

    test('kendra multilanguage request', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._event.origQuestion = "Comment puis-je publier?"
        clonedReq._settings.NATIVE_LANGUAGE = "Polish";
        clonedReq.session.qnabotcontext.userLocale = 'fr';
        
        shouldUseOriginalLanguageQuery.mockImplementation(() => {
            return false;
        });
        determineKendraLanguage.mockImplementation(() => { 
            return 'fr';
        });

        const response = await kendra.handler({ req: clonedReq, res });

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), [], 8, 600, {}, {"AttributeFilter": {"EqualsTo": {"Key": "_language_code", "Value": {"StringValue": "fr"}}}, "IndexId": "kendra-index", "QueryText": "How can I publish Kindle books?"});
    });

    test('kendra native language other than english', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._event.origQuestion = "Jak mogę publikować książki Kindle?"
        clonedReq._settings.NATIVE_LANGUAGE = "Polish";
        clonedReq.session.qnabotcontext.userLocale = 'po';
        
        shouldUseOriginalLanguageQuery.mockImplementation(() => {
            return true;
        });
        determineKendraLanguage.mockImplementation(() => { 
            return 'po';
        });

        const response = await kendra.handler({ req: clonedReq, res });

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), [], 8, 600, {}, {"AttributeFilter": {"EqualsTo": {"Key": "_language_code", "Value": {"StringValue": "po"}}}, "IndexId": "kendra-index", "QueryText": "Jak mogę publikować książki Kindle?"});
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

});
