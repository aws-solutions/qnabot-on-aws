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

const bodybuilder = require('bodybuilder');
const _ = require('lodash');
const qnabot = require('qnabot/logging');
const get_keywords = require('./keywords');
const get_embeddings = require('./embeddings');

function build_qid_query(params) {
    qnabot.log('Build_qid_query - params: ', JSON.stringify(params, null, 2));
    const query = bodybuilder()
        .orQuery('match', 'qid', params.qid)
        .rawOption('_source', { exclude: ['questions.q_vector', 'a_vector'] })
        .from(0)
        .size(1)
        .build();
    qnabot.log('ElasticSearch Query', JSON.stringify(query, null, 2));
    return Promise.resolve(query);
}

function build_query(params) {
    qnabot.log('Build_query - params: ', JSON.stringify(params, null, 2));
    return (get_keywords(params))
        .then(async (keywords) => {
            let query = bodybuilder();
            // Exclude QIDs with enableQidIntent: true. They should be matched only by Lex
            // as intents, not by ES match queries.
            query = query.notFilter('match', { enableQidIntent: { query: true } });

            const match_query = {
                quniqueterms: {
                    query: params.question,
                    boost: 2,
                },
            };

            const filter_query_unique_terms = {
                quniqueterms: {
                    query: keywords,
                    minimum_should_match: _.get(params, 'minimum_should_match', '2<75%'),
                    zero_terms_query: 'all',
                },
            };
            const filter_query_a = {
                a: {
                    query: keywords,
                    minimum_should_match: _.get(params, 'minimum_should_match', '2<75%'),
                    zero_terms_query: 'all',
                },
            };
            const filter_query_passage = {
                passage: {
                    query: keywords,
                    minimum_should_match: _.get(params, 'minimum_should_match', '2<75%'),
                    zero_terms_query: 'all',
                },
            };

            if (_.get(params, 'fuzziness')) {
                filter_query_unique_terms.quniqueterms.fuzziness = 'AUTO';
                filter_query_a.a.fuzziness = 'AUTO';
                filter_query_passage.passage.fuzziness = 'AUTO';
                match_query.quniqueterms.fuzziness = 'AUTO';
            }

            query = queryFilter(keywords, params, query, filter_query_a, filter_query_passage, filter_query_unique_terms);

            const qnaClientFilter = _.get(params, 'qnaClientFilter', '');
            query = query.orFilter('bool', {
                must: [
                    {
                        exists: {
                            field: 'clientFilterValues',
                        },
                    },
                    {
                        term: {
                            clientFilterValues: {
                                value: qnaClientFilter,
                                case_insensitive: true,
                            },
                        },
                    },
                ],
            })
                .orFilter('bool', {
                    must_not: [
                        {
                            exists: {
                                field: 'clientFilterValues',
                            },
                        },
                    ],
                }).filterMinimumShouldMatch(1);

            if (_.get(params, 'settings.EMBEDDINGS_ENABLE')) {
                // do KNN embedding match for semantic similarity
                if (params.score_answer) {
                    // match on a_vector (score_answer is true)
                    query = query.orQuery('knn', {
                        a_vector: {
                            k: _.get(params, 'settings.EMBEDDINGS_KNN_K', 10),
                            vector: await get_embeddings('q', params.question, params.settings),
                        },
                    });
                } else if (params.score_text_passage) {
                    // match on passage_vector (score_text_passage is true)
                    query = query.orQuery('knn', {
                        passage_vector: {
                            k: _.get(params, 'settings.EMBEDDINGS_KNN_K', 10),
                            vector: await get_embeddings('q', params.question, params.settings),
                        },
                    });
                } else {
                    // match on q_vector (default)
                    query = query.orQuery('nested', {
                        score_mode: 'max',
                        path: 'questions',
                        query: {
                            knn: {
                                'questions.q_vector': {
                                    k: _.get(params, 'settings.EMBEDDINGS_KNN_K', 10),
                                    vector: await get_embeddings('q', params.question, params.settings),
                                },
                            },
                        },
                    });
                }
            } else {
                // No embeddings. Do terms and phrase matches instead, and add topic filters
                if (params.score_answer) {
                    // match on answers (score_answer is true)
                    query = query.orQuery('match', 'a', params.question);
                    query = query.orQuery('match_phrase', 'a', params.question);
                } else if (params.score_text_passage) {
                    // match on text (score_text_passage is true)
                    query = query.orQuery('match', 'passage', params.question);
                    query = query.orQuery('match_phrase', 'passage', params.question);
                } else {
                    // match on questions (default)
                    query = query.orQuery('match', match_query);
                    query = query.orQuery(
                        'nested',
                        {
                            score_mode: 'max',
                            boost: _.get(params, 'phrase_boost', 4),
                            path: 'questions',
                        },
                        (q) => q.query('match_phrase', 'questions.q', params.question),
                    );
                }
                const topic = _.get(params, 'topic');
                if (topic) {
                    query = query.orQuery('match', 't', topic);
                } else {
                    // no topic - query prefers answers with empty/missing topic field for predicable response
                    // NOTE: will not work in Kendra FAQ mode since we have no equivalent Kendra query
                    query = query.orQuery('bool', {
                        should: [
                            {
                                match_all: {
                                },
                            },
                            {
                                bool: {
                                    must_not: [
                                        {
                                            exists: {
                                                field: 't',
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                        minimum_should_match: 2,
                    });
                }
            }
            query = query
                .rawOption('_source', { exclude: ['questions.q_vector', 'a_vector', 'passage_vector'] })
                .from(_.get(params, 'from', 0))
                .size(_.get(params, 'size', 1))
                .build();
            qnabot.log('ElasticSearch Query: ', JSON.stringify(query, null, 2));
            return Promise.resolve(query);
        });
}

module.exports = function (params) {
    // if question starts with "QID::" then build a Qid targeted query, else build question matching query.
    if (params.question.toLowerCase().startsWith('qid::')) {
    // question specifies targeted Qid
        params.qid = params.question.split('::')[1];
        return build_qid_query(params);
    }
    return build_query(params);
};

function queryFilter(keywords, params, query, filter_query_a, filter_query_passage, filter_query_unique_terms) {
    if (keywords.length > 0) {
        if (_.get(params, 'score_answer')) {
            query = query.filter('match', filter_query_a);
        } else if (_.get(params, 'score_text_passage')) {
            query = query.filter('match', filter_query_passage);
        } else {
            query = query.filter('match', filter_query_unique_terms);
        }
    }
    return query;
}
