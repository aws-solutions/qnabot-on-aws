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

exports.returnEsMock = function (esType) {
    return {
        search: jest.fn(() => {
            return {
                statusCode: 200,
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
            };
        }),
        scroll: jest.fn(() => {
            return {
                statusCode: 200,
                _scroll_id: '2.0',
                hits: {
                    hits: []
                }
            };
        }).mockImplementationOnce(() => {
            return {
                statusCode: 200,
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
            };
        })
    };
}
