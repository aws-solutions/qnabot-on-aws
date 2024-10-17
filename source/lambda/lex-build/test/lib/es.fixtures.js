/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.returnEsMock = function (esType) {
    return {
        search: jest.fn(() => {
            return {
                statusCode: 200,
                body: {
                    _scroll_id: '1.0',
                    hits: {
                        hits: [{
                            _source: {
                                qid: '1',
                                type: esType,
                                questions: [
                                    {
                                        q: 'What is QnABot?'
                                    },
                                    {
                                        q: 'How is weather today?'
                                    }
                                ]
                            }
                        }]
                    }
                },
            };
        }),
        scroll: jest.fn(() => {
            return {
                statusCode: 200,
                body: {
                    _scroll_id: '2.0',
                    hits: {
                        hits: []
                    }
                }
            };
        }).mockImplementationOnce(() => {
            return {
                statusCode: 200,
                body: {
                    _scroll_id: '3.0',
                    hits: {
                        hits: [{
                            _source: {
                                qid: '2',
                                type: esType,
                                questions: [
                                    {
                                        q: 'What is best place to see northern lights?'
                                    },
                                    {
                                        q: 'What is Best Indian restaurant in US?'
                                    }
                                ]
                            }
                        }]
                    }
                }
            };
        })
    };
}
