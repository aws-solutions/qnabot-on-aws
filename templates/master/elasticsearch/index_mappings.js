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

module.exports = {
    properties: {
        // all doc types have qid
        qid: {
            type: 'keyword',
        },
        // 'qna' doc type fields
        quniqueterms: {
            type: 'text',
            analyzer: 'custom_english_unique',
        },
        questions: {
            type: 'nested',
            properties: {
                q: {
                    type: 'text',
                    analyzer: 'custom_english',
                },
                q_vector: {
                    type: 'knn_vector',
                    dimension: '${EmbeddingsDimensions}',
                    method: {
                        name: 'hnsw',
                        space_type: 'cosinesimil',
                        engine: 'nmslib',
                    },
                },
            },
        },
        a: {
            type: 'text',
            analyzer: 'custom_english',
        },
        a_vector: {
            type: 'knn_vector',
            dimension: '${EmbeddingsDimensions}',
            method: {
                name: 'hnsw',
                space_type: 'cosinesimil',
                engine: 'nmslib',
            },
        },
        t: {
            type: 'text', analyzer: 'whitespace',
        },
        r: {
            properties: {
                imageUrl: { type: 'keyword' },
                title: { type: 'text' },
            },
        },
        l: {
            type: 'keyword',
        },
        // 'text' doc type fields
        passage: {
            type: 'text', analyzer: 'custom_english',
        },
        passage_vector: {
            type: 'knn_vector',
            dimension: '${EmbeddingsDimensions}',
            method: {
                name: 'hnsw',
                space_type: 'cosinesimil',
                engine: 'nmslib',
            },
        },
        // 'quiz' doc type fields
        question: {
            type: 'text',
            analyzer: 'custom_english',
        },
        incorrectAnswers: {
            type: 'text',
            analyzer: 'custom_english',
        },
        correctAnswers: {
            type: 'text',
            analyzer: 'custom_english',
        },
    },
};
