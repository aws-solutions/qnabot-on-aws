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
const handlebars = require('../../lib/handlebars');
const kendra_fallback = require('../../lib/kendra');
const kendra_retrieve = require('../../lib/kendraRetrieve');
const open_es = require('../../lib/es_query');
const { invokeLambda } = require('../../lib/fulfillment-event/invokeLambda');
const { runKendraQuery } = require('../../lib/fulfillment-event/runKendraQuery');
const { encryptor } = require('../../lib/fulfillment-event/encryptor');
const { runLlmQa } = require('../../lib/fulfillment-event/runLlmQa');
const { getHit } = require('../../lib/fulfillment-event/getHit');

const { 
    req,
    res,
    kendraQueryResponse,
    esQueryResponse,
    kendraFallbackResult
} = require('./getHit.fixtures')

jest.mock('qnabot/settings');
jest.mock('qnabot/logging');
jest.mock('../../lib/handlebars');
handlebars.mockImplementation((req, res, hit) => {
    return hit;
});
jest.mock('../../lib/kendra');
jest.mock('../../lib/kendraRetrieve');
jest.mock('../../lib/es_query');
jest.mock('../../lib/fulfillment-event/invokeLambda');
jest.mock('../../lib/fulfillment-event/runKendraQuery');
jest.mock('../../lib/fulfillment-event/runLlmQa');
jest.mock('../../lib/fulfillment-event/encryptor');

describe('getHit', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    test('no hits', async () => {
        open_es.isESonly.mockImplementation(() => {
            return false;
        });
        open_es.run_query_es.mockImplementation(() => {
            return esQueryResponse;
        });
        open_es.isQuestionAllStopwords.mockImplementation(() => {
            return false;
        });
        runKendraQuery.mockImplementation(() => {
            return kendraQueryResponse;
        });
        const [responseReq, responseRes, responseHit, responseErrors] = await getHit(req, res);
        expect(responseReq.session.qnabotcontext.kendra).toStrictEqual(kendraQueryResponse.kendra_context);
        expect(responseRes.kendraResultsCached).toStrictEqual(kendraQueryResponse.kendraResultsCached);
        expect(responseHit).toBe(undefined);

        expect(responseErrors).toStrictEqual([]);
    });

    test('forces no hits if all stopwords', async () => {
        open_es.isQuestionAllStopwords.mockImplementation(() => {
            return true;
        });
        const [responseReq, responseRes, responseHit, responseErrors] = await getHit(req, res);
        expect(responseHit).toBe(undefined);
        expect(responseErrors).toStrictEqual([]);
    });

    test('ES only', async () => {
        open_es.isESonly.mockImplementation(() => {
            return true;
        });
        const clonedEsQueryResponse = _.cloneDeep(esQueryResponse);
        clonedEsQueryResponse.hits.hits[0] = {
            _source: {}
        };

        const hit = {
            "a": "answer",
            "alt": {
                "markdown": "markdown",
                "ssml": "ssml"
            },
            "questions": [
                {
                    "q": "What is Q and A Bot"
                }
            ],
            "t": "QnA",
            "l": 'QNA:hook',
            "conditionalChaining": "true",
            "type": "qna",
            "qid": "QnABot.001",
            "answersource": "ElasticSearch (matched questions field)",
            "debug": []
        };

        clonedEsQueryResponse.hits.hits[0]._source = _.cloneDeep(hit);
        open_es.run_query_es.mockImplementation(() => {
            return clonedEsQueryResponse;
        });
        open_es.isQuestionAllStopwords.mockImplementation(() => {
            return false;
        });
        invokeLambda.mockImplementation((l, req, res) => {
            return [req, res];
        });
        encryptor.encrypt.mockImplementation((arg) => {
            return 'encrypted';
        });

        const expectedHit = _.cloneDeep(hit);
        expectedHit.conditionalChaining = "encrypted";
        expectedHit.l = "";
        expectedHit.args = [];
        expectedHit.r = {};

        const [responseReq, responseRes, responseHit, responseErrors] = await getHit(req, res);
        expect(responseHit).toStrictEqual(expectedHit);
        expect(responseErrors).toStrictEqual([]);
    });

    test('ES only with user info', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.RUN_LAMBDAHOOK_FROM_QUERY_STEP = false;
        clonedReq.qid = undefined;
        const clonedRes = _.cloneDeep(res);
        clonedRes._userInfo = {
            recentTopics: [{
                topic:'qna',
                dateTime: 'today'
            }],
        }
        open_es.isESonly.mockImplementation(() => {
            return true;
        });
        const clonedEsQueryResponse = _.cloneDeep(esQueryResponse);
        clonedEsQueryResponse.hits.hits[0] = {
            _source: {}
        };

        const hit = {
            "a": "answer",
            "alt": {
                "markdown": "markdown",
                "ssml": "ssml"
            },
            "questions": [
                {
                    "q": "What is Q and A Bot"
                }
            ],
            "t": "QnA",
            "l": 'QNA:hook',
            "conditionalChaining": "true",
            "type": "qna",
            "qid": "QnABot.001",
            "answersource": "ElasticSearch (matched questions field)"
        };

        clonedEsQueryResponse.hits.hits[0]._source = _.cloneDeep(hit);
        open_es.run_query_es.mockImplementation(() => {
            return clonedEsQueryResponse;
        });
        open_es.isQuestionAllStopwords.mockImplementation(() => {
            return false;
        });
        invokeLambda.mockImplementation((l, req, res) => {
            return [req, res];
        });

        const expectedHit = _.cloneDeep(hit);
        expectedHit.conditionalChaining = "encrypted";
        expectedHit.debug = [];

        const [responseReq, responseRes, responseHit, responseErrors] = await getHit(clonedReq, clonedRes);
        expect(responseHit).toStrictEqual(expectedHit);
        expect(responseErrors).toStrictEqual([]);
    });

    test('text passage', async () => {
        open_es.isESonly.mockImplementation(() => {
            return true;
        });
        const clonedEsQueryResponse = _.cloneDeep(esQueryResponse);
        clonedEsQueryResponse.hits.hits[0] = {
            _source: {}
        };

        const hit = {
            "passage": "answer",
            "alt": {
                "markdown": "",
                "ssml": ""
            },
            "questions": [
                {
                    "q": "What is Q and A Bot"
                }
            ],
            "type": "text",
            "qid": "QnABot.001",
            "answersource": "ElasticSearch (matched questions field)"
        };

        clonedEsQueryResponse.hits.hits[0]._source = _.cloneDeep(hit)
        open_es.run_query_es.mockImplementation(() => {
            return clonedEsQueryResponse;
        });
        open_es.isQuestionAllStopwords.mockImplementation(() => {
            return false;
        });
        runLlmQa.mockImplementation((req, hit) => {
            return [hit, []];
        });
        invokeLambda.mockImplementation((l, req, res) => {
            return [req, res];
        });

        const expectedHit = _.cloneDeep(hit);
        expectedHit.a = "answer";
        expectedHit.alt.markdown = "answer";
        expectedHit.alt.ssml = "answer";
        expectedHit.debug = [];
        expectedHit.args = [];
        expectedHit.l = "";

        const [responseReq, responseRes, responseHit, responseErrors] = await getHit(req, res);
        expect(responseHit).toStrictEqual(expectedHit);
        expect(responseErrors).toStrictEqual([]);
    });

    test('text passage with rich text', async () => {
        open_es.isESonly.mockImplementation(() => {
            return true;
        });
        const clonedEsQueryResponse = _.cloneDeep(esQueryResponse);
        clonedEsQueryResponse.hits.hits[0] = {
            _source: {}
        };
        clonedEsQueryResponse.hits.hits[0]._source = {
            "passage": "answer",
            "a": "answer",
            "alt": {
                "markdown": "answer",
                "ssml": "answer"
            },
            "questions": [
                {
                    "q": "What is Q and A Bot"
                }
            ],
            "type": "text",
            "qid": "QnABot.001",
            "answersource": "ElasticSearch (matched questions field)"
        };
        open_es.run_query_es.mockImplementation(() => {
            return clonedEsQueryResponse;
        });
        open_es.isQuestionAllStopwords.mockImplementation(() => {
            return false;
        });
        runLlmQa.mockImplementation((req, hit) => {
            return [hit, []];
        });
        invokeLambda.mockImplementation((l, req, res) => {
            return [req, res];
        });
        const [responseReq, responseRes, responseHit, responseErrors] = await getHit(req, res);
        expect(responseHit).toStrictEqual(clonedEsQueryResponse.hits.hits[0]._source);
        expect(responseErrors).toStrictEqual([]);
    });

    test('kendra redirect', async () => {
        open_es.isESonly.mockImplementation(() => {
            return false;
        });
        const clonedEsQueryResponse = _.cloneDeep(esQueryResponse);
        clonedEsQueryResponse.hits.hits[0] = {
            _source: {}
        };
        
        const hit = {
            "a": "answer",
            "alt": {
                "markdown": "markdown",
                "ssml": "ssml"
            },
            "questions": [
                {
                    "q": "What is Q and A Bot"
                }
            ],
            "type": "qna",
            "qid": "QnABot.001",
            "kendraRedirectQueryText": "qna",
            "answersource": "ElasticSearch (matched questions field)"
        };
        clonedEsQueryResponse.hits.hits[0]._source = _.cloneDeep(hit);

        open_es.run_query_es.mockImplementation(() => {
            return clonedEsQueryResponse;
        });
        open_es.isQuestionAllStopwords.mockImplementation(() => {
            return false;
        });
        runKendraQuery.mockImplementation(() => {
            return kendraQueryResponse;
        });
        kendra_retrieve.handler.mockImplementation(() => {
            return kendraQueryResponse;
        });
        kendra_fallback.handler.mockImplementation(() => {
            return kendraFallbackResult;
        });

        const expectedHit = _.cloneDeep(hit);
        expectedHit.alt.markdown = "Source Link: www.myurl.com";
        expectedHit.alt.ssml = "";
        expectedHit.debug = [];
        expectedHit.args = [];
        expectedHit.l = "";
        expectedHit.answersource = "KENDRA REDIRECT";

        const [responseReq, responseRes, responseHit, responseErrors] = await getHit(req, res);
        expect(responseHit).toStrictEqual(expectedHit);
        expect(responseErrors).toStrictEqual([]);
        expect(kendra_fallback.handler).toHaveBeenCalledTimes(1);
    });

    test('kendra redirect with no hits', async () => {
        open_es.isESonly.mockImplementation(() => {
            return false;
        });
        const clonedEsQueryResponse = _.cloneDeep(esQueryResponse);
        clonedEsQueryResponse.hits.hits[0] = {
            _source: {}
        };
        clonedEsQueryResponse.hits.hits[0]._source = {
            "a": "answer",
            "alt": {
                "markdown": "markdown",
                "ssml": "ssml"
            },
            "questions": [
                {
                    "q": "What is Q and A Bot"
                }
            ],
            "type": "qna",
            "qid": "QnABot.001",
            "kendraRedirectQueryText": "qna",
            "answersource": "ElasticSearch (matched questions field)"
        };
        open_es.run_query_es.mockImplementation(() => {
            return clonedEsQueryResponse;
        });
        open_es.isQuestionAllStopwords.mockImplementation(() => {
            return false;
        });
        runKendraQuery.mockImplementation(() => {
            return kendraQueryResponse;
        });
        kendra_retrieve.handler.mockImplementation(() => {
            return kendraQueryResponse;
        });
        kendra_fallback.handler.mockImplementation(() => {
            return undefined;
        });

        const [responseReq, responseRes, responseHit, responseErrors] = await getHit(req, res);
        expect(responseHit).toBe(undefined);
        expect(responseErrors).toStrictEqual([]);
        expect(kendra_fallback.handler).toHaveBeenCalledTimes(1);
    });

    test('kendra fallback', async () => {
        open_es.isESonly.mockImplementation(() => {
            return false;
        });
        open_es.run_query_es.mockImplementation(() => {
            return esQueryResponse;
        });
        open_es.isQuestionAllStopwords.mockImplementation(() => {
            return false;
        });
        runKendraQuery.mockImplementation(() => {
            return kendraQueryResponse;
        });
        kendra_retrieve.handler.mockImplementation(() => {
            return undefined;
        });
        kendra_fallback.handler.mockImplementation(() => {
            return kendraFallbackResult;
        });

        const expectedResult = _.cloneDeep(kendraFallbackResult);
        expectedResult.args = [];
        expectedResult.l = "";
        expectedResult.refMarkdown = "Sources: www.myurl.com";

        const [responseReq, responseRes, responseHit, responseErrors] = await getHit(req, res);
        expect(responseHit).toStrictEqual(expectedResult);
        expect(responseErrors).toStrictEqual([]);
        expect(kendra_fallback.handler).toHaveBeenCalledTimes(1);
    });

    test('kendra retrieval', async () => {
        open_es.isESonly.mockImplementation(() => {
            return false;
        });
        open_es.run_query_es.mockImplementation(() => {
            return esQueryResponse;
        });
        open_es.isQuestionAllStopwords.mockImplementation(() => {
            return false;
        });
        runKendraQuery.mockImplementation(() => {
            return kendraQueryResponse;
        });
        kendra_retrieve.handler.mockImplementation(() => {
            return kendraFallbackResult;
        });
        runLlmQa.mockImplementation((req, hit) => {
            return [hit, []];
        });

        const expectedResult = _.cloneDeep(kendraFallbackResult);

        const [responseReq, responseRes, responseHit, responseErrors] = await getHit(req, res);
        expect(responseHit).toStrictEqual(expectedResult);
        expect(responseErrors).toStrictEqual([]);
        expect(kendra_retrieve.handler).toHaveBeenCalledTimes(1);
    });

    test('kendra retrieval with error', async () => {
        const clonedKendraFallbackResult = _.cloneDeep(kendraFallbackResult);
        clonedKendraFallbackResult.alt.markdown = "";

        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_QA_ENABLE = false;

        open_es.isESonly.mockImplementation(() => {
            return false;
        });
        open_es.run_query_es.mockImplementation(() => {
            return esQueryResponse;
        });
        open_es.isQuestionAllStopwords.mockImplementation(() => {
            return false;
        });
        runKendraQuery.mockImplementation(() => {
            return kendraQueryResponse;
        });
        kendra_retrieve.handler.mockImplementation(() => {
            return undefined;
        });
        kendra_fallback.handler.mockImplementation(() => {
            return clonedKendraFallbackResult;
        });
        runLlmQa.mockImplementation((req, hit) => {
            return [undefined, [{msg: 'error'}]];
        });

        const [responseReq, responseRes, responseHit, responseErrors] = await getHit(clonedReq, res);
        expect(responseHit).toBe(undefined);
        expect(responseErrors).toStrictEqual([{msg: 'error'}]);
        expect(kendra_fallback.handler).toHaveBeenCalledTimes(1);
    });
})
