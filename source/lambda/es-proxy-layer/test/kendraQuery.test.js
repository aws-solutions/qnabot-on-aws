/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const { queryKendra } = require('../lib/kendraClient');
const kendra = require('../lib/kendraQuery');
const es_query = require('../lib/es_query');

jest.mock('../lib/es_query');
jest.mock('../lib/kendraClient');
jest.mock('qnabot/settings');
jest.mock('qnabot/logging');

const { params, kendraQueryResponse } = require('./kendraQuery.fixtures');

describe('kendra', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        queryKendra.mockImplementation((resArray) => {
            return new Promise((resolve, reject) => {
                resArray.originalKendraIndexId = 'test-index';
                resArray.push(kendraQueryResponse);
                resolve(kendraQueryResponse);
            });
        });
        es_query.run_qid_query_es.mockImplementation(() => {
            return {
                hits: {
                    hits: [
                        {
                            _source: {
                                qid: 'TEST.001'
                            }
                        }
                    ]
                }
            }
        });
        es_query.hasJsonStructure.mockImplementation(() => {
            return true;
        });
    });

    test('returns opensearch faq result', async () => {
        const response = await kendra.handler(params);
        expect(es_query.run_qid_query_es).toBeCalledWith(
            {
                kendra_faq_index: 'test-index',
                maxRetries: 1,
                maxRetries: 1,
                minimum_score: 'HIGH',
                question: 'How do I publish on Kindle?',
                retryDelay: 1000,
                same_index: true,
                size: 1
            },
            'TEST.001'
        );
        expect(es_query.hasJsonStructure).toBeCalledWith('{\"_source_qid\":\"TEST.001\"}');
        expect(response.kendraResultsCached.ResultItems[0].Id).toBe('QA ID');
        expect(response.kendraResultsCached.ResultItems[0].Type).toBe('QUESTION_ANSWER');
        expect(response.hits.max_score).toBe(1);
        expect(response.hits.hits[0]).toStrictEqual({
            _id: 'TEST.001',
            _index: 'test-index',
            _score: 1,
            _source: {
                qid: 'TEST.001',
            },
            _type: '_faq'
        });
    });

    test('does not call opensearch if document uri does not have json structure', async () => {
        es_query.hasJsonStructure.mockImplementation(() => {
            return false;
        });
        const response = await kendra.handler(params);
        expect(es_query.hasJsonStructure).toBeCalledWith('{\"_source_qid\":\"TEST.001\"}');
        expect(es_query.run_qid_query_es).not.toBeCalled();
        expect(response.hits.max_score).toBe(0);
        expect(response.kendraResultsCached.ResultItems[0].Id).toBe('QA ID');
        expect(response.kendraResultsCached.ResultItems[0].Type).toBe('QUESTION_ANSWER');
    });

    test('no results from kendra', async () => {
        const clonedKendraQueryResponse = _.cloneDeep(kendraQueryResponse);
        clonedKendraQueryResponse.ResultItems = [];
        queryKendra.mockImplementation((resArray) => {
            return new Promise((resolve, reject) => {
                resArray.originalKendraIndexId = 'test-index';
                resArray.push(clonedKendraQueryResponse);
                resolve(resArray);
            });
        });
        const response = await kendra.handler(params);
        expect(es_query.run_qid_query_es).not.toBeCalled();
        expect(es_query.hasJsonStructure).not.toBeCalled();
        expect(response.hits.max_score).toBe(0);
    });

    test('returns no result when opensearch result has client filter', async () => {
        es_query.run_qid_query_es.mockImplementation(() => {
            return {
                hits: {
                    hits: [{
                        _source: {
                            qid: 'TEST.001',
                            QNAClientFilter: 'filter',
                        },
                    }]
                }
            }
        });
        const response = await kendra.handler(params);
        expect(es_query.run_qid_query_es).toBeCalledWith(
            {
                kendra_faq_index: 'test-index',
                maxRetries: 1,
                maxRetries: 1,
                minimum_score: 'HIGH',
                question: 'How do I publish on Kindle?',
                retryDelay: 1000,
                same_index: true,
                size: 1
            },
            'TEST.001'
        );
        expect(es_query.hasJsonStructure).toBeCalledWith('{\"_source_qid\":\"TEST.001\"}');
        expect(response.kendraResultsCached.ResultItems[0].Id).toBe('QA ID');
        expect(response.kendraResultsCached.ResultItems[0].Type).toBe('QUESTION_ANSWER');
        expect(response.hits.max_score).toBe(0);
    });

    test('does not call opensearch if source id is undefined', async () => {
        const clonedKendraQueryResponse = _.cloneDeep(kendraQueryResponse);
        clonedKendraQueryResponse.ResultItems[0].DocumentURI = "{}";
        queryKendra.mockImplementation((resArray) => {
            return new Promise((resolve, reject) => {
                resArray.originalKendraIndexId = 'test-index';
                resArray.push(clonedKendraQueryResponse);
                resolve(resArray);
            });
        });
        const response = await kendra.handler(params);
        expect(es_query.run_qid_query_es).not.toBeCalled();
        expect(es_query.hasJsonStructure).toBeCalledWith('{}');
        expect(response.kendraResultsCached.ResultItems[0].Id).toBe('QA ID');
        expect(response.kendraResultsCached.ResultItems[0].Type).toBe('QUESTION_ANSWER');
        expect(response.hits.max_score).toBe(1);
        expect(response.hits.hits[0]).toStrictEqual({
            _id: undefined,
            _index: 'test-index',
            _score: 1,
            _source: {},
            _type: '_faq'
        });
    });

    test('no results from opensearch', async () => {
        es_query.run_qid_query_es.mockImplementation(() => {
            return {
                hits: {
                    hits: []
                }
            }
        });
        const response = await kendra.handler(params);
        expect(es_query.run_qid_query_es).toBeCalledWith(
            {
                kendra_faq_index: 'test-index',
                maxRetries: 1,
                maxRetries: 1,
                minimum_score: 'HIGH',
                question: 'How do I publish on Kindle?',
                retryDelay: 1000,
                same_index: true,
                size: 1
            },
            'TEST.001'
        );
        expect(es_query.hasJsonStructure).toBeCalledWith('{\"_source_qid\":\"TEST.001\"}');
        expect(response.kendraResultsCached.ResultItems[0].Id).toBe('QA ID');
        expect(response.kendraResultsCached.ResultItems[0].Type).toBe('QUESTION_ANSWER');
        expect(response.hits.max_score).toBe(0);
    });

    test('omits results below confidence score', async () => {
        const params = {
            question: 'How do I publish on Kindle?',
            maxRetries: 1,
            retryDelay: 1000,
            kendra_faq_index: 'test-index',
            minimum_score: 'VERY_HIGH',
        };
        const response = await kendra.handler(params);
        expect(es_query.run_qid_query_es).not.toBeCalled();
        expect(es_query.hasJsonStructure).not.toBeCalled();
        expect(response.hits.max_score).toBe(0);
    });

    test('returns no results when minimum score is not valid', async () => {
        const params = {
            question: 'How do I publish on Kindle?',
            maxRetries: 1,
            retryDelay: 1000,
            kendra_faq_index: 'test-index',
            minimum_score: 'INVALID',
        };
        const response = await kendra.handler(params);
        expect(es_query.run_qid_query_es).not.toBeCalled();
        expect(es_query.hasJsonStructure).not.toBeCalled();
        expect(response.hits.max_score).toBe(0);
    });

    test('throws error when kendra index is undefined', async () => {
        const params = {
            question: 'How do I publish on Kindle?',
            maxRetries: 1,
            retryDelay: 1000,
            kendra_faq_index: undefined,
            minimum_score: 'INVALID',
        };
        try {
            await kendra.handler(params);
            expect(true).toBe(false);
        } catch (error) {
            expect(error.message).toBe('Undefined KendraFAQIndex: undefined');
        }
    });

});
