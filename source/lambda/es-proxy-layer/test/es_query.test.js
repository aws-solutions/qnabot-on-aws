/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const _ = require('lodash');
const qnabot = require('qnabot/logging');
const request = require('../lib/request');
const build_es_query = require('../lib/esbodybuilder');
const es_query = require('../lib/es_query');

const { esQueryResponse } = require('./es_query.fixtures');

jest.mock('../lib/request');
jest.mock('../lib/esbodybuilder');
jest.mock('qnabot/settings');
jest.mock('qnabot/logging');


describe('es_query run_query_es', () => {
    const req = {
        size: 1,
        _info: {
            es: {
                address: 'url.com',
                index: 'test',
            }
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();

        request.mockImplementation(async () => {
            return esQueryResponse;
        });
        
        build_es_query.mockImplementation(() => {
            return 'body';
        });
    });

    test('no hits condition', async () => {
        const query_params = {
            question: 'test question',
            size: 1,
            settings: {
                ES_SCORE_ANSWER_FIELD: 1,
                ES_SCORE_TEXT_ITEM_PASSAGES: 1,
                EMBEDDINGS_SCORE_THRESHOLD: 1
            }
        };

        const result = await es_query.run_query_es(req, query_params);

        expect(build_es_query).toBeCalledTimes(3);
        expect(request).toBeCalledTimes(3);
        expect(result).toStrictEqual({
            took: 1,
            timed_out: false,
            _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
            hits: { total: { value: 0, relation: 'eq' }, max_score: null, hits: [] }
        });
    });

    test('match initial request', async () => {
        const query_params = {
            question: 'test question',
            size: 2,
            settings: {
                ES_SCORE_ANSWER_FIELD: 1,
                ES_SCORE_TEXT_ITEM_PASSAGES: 1,
                EMBEDDINGS_ENABLE: true,
                EMBEDDINGS_SCORE_THRESHOLD: 0.75
            }
        };

        const clonedEsQueryResponse = _.cloneDeep(esQueryResponse);
        clonedEsQueryResponse.hits.hits.push('test');
        clonedEsQueryResponse.hits.max_score = 1;
        clonedEsQueryResponse.hits.length = 1;
        request.mockImplementation(async (obj) => {
            return clonedEsQueryResponse;
        });

        const result = await es_query.run_query_es(req, query_params);

        expect(build_es_query).toBeCalledWith(query_params);
        expect(request).toBeCalledWith({
            url: 'https://url.com/test/_search?search_type=dfs_query_then_fetch',
            body: 'body',
            'method': 'GET',
        });

        expect(result).toStrictEqual({
            took: 1,
            timed_out: false,
            _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
            hits: { 
                total: { value: 0, relation: 'eq' }, 
                max_score: 1, 
                hits: [{
                    _source: {
                        answersource: 'OpenSearch (matched questions field)',
                    },
                }], 
                length: 1 
            },
        });
    });

    test('match qid as field', async () => {
        const query_params = {
            question: 'qid::test',
            size: 1,
            settings: {
                ES_SCORE_ANSWER_FIELD: 1,
                ES_SCORE_TEXT_ITEM_PASSAGES: 1,
                EMBEDDINGS_ENABLE: true,
                EMBEDDINGS_SCORE_THRESHOLD: 0.75
            }
        };

        const clonedEsQueryResponse = _.cloneDeep(esQueryResponse);
        clonedEsQueryResponse.hits.hits.push('test');
        clonedEsQueryResponse.hits.max_score = 1;
        clonedEsQueryResponse.hits.length = 1;
        request.mockImplementation(async (obj) => {
            return clonedEsQueryResponse;
        });

        const result = await es_query.run_query_es(req, query_params);

        expect(build_es_query).toBeCalledWith(query_params);

        expect(result).toStrictEqual({
            took: 1,
            timed_out: false,
            _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
            hits: { 
                total: { value: 0, relation: 'eq' }, 
                max_score: 1, 
                hits: [{
                    _source: {
                        answersource: 'OpenSearch (matched QID field)',
                    },
                }], 
                length: 1 
            },
        });
    });

    test('match qid as field with no hits', async () => {
        const query_params = {
            question: 'qid::test',
            size: 1,
            settings: {
                ES_SCORE_ANSWER_FIELD: 1,
                ES_SCORE_TEXT_ITEM_PASSAGES: 1,
                EMBEDDINGS_SCORE_THRESHOLD: 1
            }
        };

        await es_query.run_query_es(req, query_params);

        expect(build_es_query).toBeCalledTimes(3);
        expect(request).toBeCalledTimes(3);
    });

    test('match against answer', async () => {

        const query_params = {
            question: 'test question',
            size: 1,
            settings: {
                ES_SCORE_ANSWER_FIELD: true,
                EMBEDDINGS_ENABLE: true,
                ES_SCORE_ANSWER_FIELD: true,
                EMBEDDINGS_SCORE_ANSWER_THRESHOLD: 0.75
            }
        };

        const clonedEsQueryResponse = _.cloneDeep(esQueryResponse);
        clonedEsQueryResponse.hits.hits.push('test');
        clonedEsQueryResponse.hits.max_score = 1;
        clonedEsQueryResponse.hits.length = 1;
        request
            .mockImplementationOnce(async () => esQueryResponse)
            .mockImplementationOnce(async () => clonedEsQueryResponse);

        const result = await es_query.run_query_es(req, query_params);

        expect(build_es_query).toBeCalledWith(query_params);
        expect(query_params.score_answer).toBe(true);
        expect(build_es_query).toBeCalledTimes(2);
        expect(request).toBeCalledTimes(2);

        expect(result.hits.hits[0]._source.answersource).toBe('OpenSearch (matched answer field)');
    });

    test('match against text passage', async () => {

        const query_params = {
            question: 'test question',
            size: 1,
            settings: {
                EMBEDDINGS_ENABLE: true,
                ES_SCORE_TEXT_ITEM_PASSAGES: true,
                EMBEDDINGS_SCORE_ANSWER_THRESHOLD: 0.75
            }
        };

        const clonedEsQueryResponse = _.cloneDeep(esQueryResponse);
        clonedEsQueryResponse.hits.hits.push('test');
        clonedEsQueryResponse.hits.max_score = 1;
        clonedEsQueryResponse.hits.length = 1;
        request
            .mockImplementationOnce(async () => esQueryResponse)
            .mockImplementationOnce(async () => clonedEsQueryResponse);

        const result = await es_query.run_query_es(req, query_params);

        expect(build_es_query).toBeCalledWith(query_params);
        expect(query_params.score_answer).toBe(false);
        expect(query_params.score_text_passage).toBe(true);
        expect(build_es_query).toBeCalledTimes(2);
        expect(request).toBeCalledTimes(2);

        expect(result.hits.hits[0]._source.answersource).toBe('OpenSearch (matched answer field)');
    });
});

describe('es_query run_qid_query_es', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        request.mockImplementation(async () => {
            return esQueryResponse;
        });
        
        build_es_query.mockImplementation(() => {
            return 'body';
        });
    });

    test('returns opensearch result', async () => {

        const params = {
            es_address: 'url.com',
            es_path: '/test',
        };

        const result = await es_query.run_qid_query_es(params, 'qid');

        expect(build_es_query).toBeCalledWith({question: 'qid::qid'});
        expect(request).toBeCalledWith({
            url: 'https://url.com/test',
            body: 'body',
            'method': 'GET',
        });

        expect(result).toStrictEqual({
            took: 1,
            timed_out: false,
            _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
            hits: {
                total: { value: 0, relation: 'eq' }, 
                max_score: null,
                hits: [],
            },
        });
    });
});

describe('es_query hasJsonStructure', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return false if not a string', async () => {
        const str = 123;

        expect(es_query.hasJsonStructure(str)).toBe(false);
    });

    test('should return false if cannot be parsed', async () => {
        const str = '{';

        expect(es_query.hasJsonStructure(str)).toBe(false);
    });

    test('should return true if object can be parsed into JSON', async () => {
        const str = JSON.stringify({
            test: 'object'
        });

        expect(es_query.hasJsonStructure(str)).toBe(true);
    });

    test('should return true if array can be parsed into JSON', async () => {
        const str = JSON.stringify(['test']);

        expect(es_query.hasJsonStructure(str)).toBe(true);
    });
});

describe('es_query isESonly', () => {
    const req = {
        _settings: {
            ES_NO_HITS_QUESTION: 'ES_NO_HITS_QUESTION'
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns true if question matches no hits', async () => {
        const query_params = {
            question: 'ES_NO_HITS_QUESTION'
        };

        const result = await es_query.isESonly(req, query_params);
        expect(result).toBe(true);
    });

    test('returns true if question matches no hits', async () => {
        const query_params = {
            question: 'qid::test'
        };

        const result = await es_query.isESonly(req, query_params);
        expect(result).toBe(true);
    });

    test('returns true if question topic set', async () => {
        const query_params = {
            question: 'no match',
            topic: 'test'
        };

        const result = await es_query.isESonly(req, query_params);
        expect(result).toBe(true);
    });

    test('returns true if question qnaClientFilter set', async () => {
        const query_params = {
            question: 'no match',
            qnaClientFilter: 'test'
        };

        const result = await es_query.isESonly(req, query_params);
        expect(result).toBe(true);
    });

    test('returns true if question score_answer set', async () => {
        const query_params = {
            question: 'no match',
            score_answer: 'test'
        };

        const result = await es_query.isESonly(req, query_params);
        expect(result).toBe(true);
    });

    test('returns true if question kendraIndex set', async () => {
        const query_params = {
            question: 'no match',
            kendraIndex: ''
        };

        const result = await es_query.isESonly(req, query_params);
        expect(result).toBe(true);
    });

    test('returns true if less than 2 words', async () => {
        const query_params = {
            question: 'match'
        };

        const result = await es_query.isESonly(req, query_params);
        expect(result).toBe(true);
    });

    test('returns false if more than 1 word and no previous conditions matched', async () => {
        const query_params = {
            question: 'no match'
        };

        const result = await es_query.isESonly(req, query_params);
        expect(result).toBe(false);
    });
});

describe('es_query isQuestionAllStopwords', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns true if all words are stop words', async () => {
        const stopWords =
            'a,an,and,are,as,at,be,but,by,for,if,in,into,is,it,not,of,on,or,such,that,the,their,then,there,these,they,this,to,was,will,with'
                .split(',')
                .join(' ');
        expect(es_query.isQuestionAllStopwords(stopWords)).toBe(true);
    });

    test('returns false if all words are stop words', async () => {
        const notAllStopWords =
            'a,an,and,are,as,at,be,but,by,for,if,in,into,is,it,not,of,on,or,such,that,the,their,then,there,these,they,this,to,was,will,with,STOPWORD'
                .split(',')
                .join(' ');
        expect(es_query.isQuestionAllStopwords(notAllStopWords)).toBe(false);
    });
});
