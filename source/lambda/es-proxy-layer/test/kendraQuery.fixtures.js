/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.params = {
    question: 'How do I publish on Kindle?',
    maxRetries: 1,
    retryDelay: 1000,
    kendra_faq_index: 'test-index',
    minimum_score: 'HIGH',
    size: 1,
    same_index: true
};


exports.kendraQueryResponse = {
    'FacetResults': [],
    'QueryId': '503a3ae2-490e-4778-99aa-5703bf2cfe0a',
    'ResultItems': [
        {
            'Id': 'QA ID',
            'AnswerText': {
                'TextWithHighlights': [
                    
                ],
                'Text': '605feet'
            },
            'DocumentExcerpt': {
                'Highlights': [
                    {
                        'BeginOffset': 0,
                        'EndOffset': 8,
                        'TopAnswer': false
                    }
                ],
                'Text': '605feet'
            },
            'AdditionalAttributes': [
                {
                    'Key': 'AnswerText',
                    'ValueType': 'TEXT_WITH_HIGHLIGHTS_VALUE',
                    'Value': {
                        'TextWithHighlightsValue': {
                            'Text': 'Publish with us',
                            'Highlights': [
                                {
                                    'BeginOffset': 0,
                                    'EndOffset': 3,
                                    'TopAnswer': false
                                }
                            ]
                        }
                    }
                },
                {
                    'Key': 'AnswerText',
                    'ValueType': 'TEXT_WITH_HIGHLIGHTS_VALUE',
                    'Value': {
                        'TextWithHighlightsValue': {
                            'Text': 'QA answer',
                            'Highlights': [
                                {
                                    'BeginOffset': 0,
                                    'EndOffset': 3,
                                    'TopAnswer': false
                                }
                            ]
                        }
                    }
                }
            ],
            'Type': 'QUESTION_ANSWER',
            'ScoreAttributes': {
                'ScoreConfidence': 'HIGH'
            },
            'QuestionText': {
                'Highlights': [
                    {
                        'BeginOffset': 12,
                        'EndOffset': 18,
                        'TopAnswer': false
                    },
                    {
                        'BeginOffset': 26,
                        'EndOffset': 31,
                        'TopAnswer': false
                    },
                    {
                        'BeginOffset': 32,
                        'EndOffset': 38,
                        'TopAnswer': false
                    }
                ],
                'Text': 'whatistheheightoftheSpaceNeedle?'
            },
            "DocumentURI": JSON.stringify({
                _source_qid: 'TEST.001',
            })
        }
    ],
    'TotalNumberOfResults': 7972,
    'originalKendraIndexId': 'kendra-index'
};
