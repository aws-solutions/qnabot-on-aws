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
    number_of_shards: '1',
    'index.knn': true,
    analysis: {
        filter: {
            english_stop: {
                type: 'stop',
                stopwords: ['a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is', 'it',
                    'not', 'of', 'on', 'or', 'such', 'that', 'the', 'their', 'then', 'there', 'these',
                    'they', 'this', 'to', 'was', 'will', 'with',
                ],
            },
            english_keywords: {
                type: 'keyword_marker',
                keywords: ['example'],
            },
            english_stemmer: {
                type: 'stemmer',
                language: 'english',
            },
            english_possessive_stemmer: {
                type: 'stemmer',
                language: 'possessive_english',
            },
        },
        analyzer: {
            custom_english: {
                type: 'custom',
                tokenizer: 'standard',
                filter: [
                    'english_possessive_stemmer',
                    'lowercase',
                    'english_stop',
                    'english_keywords',
                    'english_stemmer',
                ],
            },
            custom_english_unique: {
                type: 'custom',
                tokenizer: 'standard',
                filter: [
                    'english_possessive_stemmer',
                    'lowercase',
                    'english_stop',
                    'english_keywords',
                    'english_stemmer',
                    'unique',
                ],
            },
        },
    },
};
