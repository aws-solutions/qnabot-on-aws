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
const { queryKendra } = require('../lib/kendraClient');
const kendra = require('../lib/kendra');
const { signS3URL } = require('../lib/signS3URL');
const es_query = require('../lib/es_query');

jest.mock('../lib/es_query');
jest.mock('../lib/kendraClient');
jest.mock('../lib/signS3URL');
jest.mock('qnabot/settings');
jest.mock('qnabot/logging');

signS3URL.mockImplementation((documentURI, expireSeconds, cb) => {
    cb('www.signedurl.com')
});

const { 
    req,
    res,
    kendraQueryResponse,
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
    })

    test('QUESTION_ANSWER type', async () => {
        const response = await kendra.handler({req, res});
        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), "kendra-index", "How can I publish Kindle books?", [], 8, 600);
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
        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), "kendra-index", "How can I publish Kindle books?", [], 8, 600);
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
        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), "kendra-index", "How can I publish Kindle books?", [], 8, 600);
        expect(response.a).not.toContain("While I did not find an exact answer, these search results from Amazon Kendra might be helpful");
        expect(response.a).toContain("Source Link: https://kdp.amazon.com/publish");
    });

    test('should return cached results', async () => {
        const clonedRes = _.cloneDeep(res);
        clonedRes.kendraResultsCached = _.cloneDeep(kendraQueryResponse);

        await kendra.handler({req, res: clonedRes});
        expect(queryKendra).not.toHaveBeenCalled();
    });

    test('ANSWER type', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE = 'MEDIUM'
        clonedReq._settings.ALT_SEARCH_KENDRA_RESPONSE_TYPES = 'QUESTION_ANSWER,ANSWER'

        const response = await kendra.handler({req:clonedReq, res});

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), "kendra-index", "How can I publish Kindle books?", [], 8, 600);
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

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), "kendra-index", "How can I publish Kindle books?", [], 8, 600);
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

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), "kendra-index", "How can I publish Kindle books?", [], 8, 600);
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

    test('QUESTION_ANSWER type', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE = 'LOW'
        clonedReq._settings.ALT_SEARCH_KENDRA_RESPONSE_TYPES = 'QUESTION_ANSWER'

        const response = await kendra.handler({req:clonedReq, res});

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), "kendra-index", "How can I publish Kindle books?", [], 8, 600);
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

        const response = await kendra.handler({req:clonedReq, res});

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), "kendra-index", "How can I publish?", [], 8, 600);
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

        const response = await kendra.handler({req:clonedReq, res});

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), "kendra-index", "How can I publish?", [], 8, 600);
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

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), "kendra-index", "How can I publish Kindle books?", [], 8, 600);
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

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), "kendra-index", "How can I publish Kindle books?", [], 8, 600);
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

        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), "kendra-index", "How can I publish Kindle books?", [], 8, 600);
        expect(response).toBe(undefined);
    });

    test('disable abbreviated ssml', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ALT_SEARCH_KENDRA_ABBREVIATE_MESSAGE_FOR_SSML = false;
        clonedReq._settings.ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT = 0;

        const response = await kendra.handler({req: clonedReq, res});
        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), "kendra-index", "How can I publish Kindle books?", [], 8, 600);
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
        expect(queryKendra).toHaveBeenCalledWith(expect.any(Array), "kendra-index", "How can I publish Kindle books?", [], 8, 600);
        expect(response.alt.ssml).toBe("<speak> ...Publish with Kindle Direct Publishing in 3 simple steps Step 1: Prepare your manuscript and cover files Format your... </speak>");
        expect(response.alt.markdown).toContain("**While I did not find an exact answer, these search results from Amazon Kendra might be helpful.**");
    });


    afterAll(() => {
        process.env = OLD_ENV;
    });

});
