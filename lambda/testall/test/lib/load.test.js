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

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');
const s3Mock = mockClient(S3Client);
const lambdaMock = mockClient(LambdaClient);
const load = require('../../lib/load');
require('aws-sdk-client-mock-jest');

describe('when calling load function', () => {
    const OLD_ENV = process.env;
    beforeEach(() => {
        process.env = { ...OLD_ENV };
        s3Mock.reset();
        lambdaMock.reset();
    });

    afterEach(() => {
        process.env = OLD_ENV;
        s3Mock.restore();
        lambdaMock.restore();
    });

    it('should load data and update config when empty hits is returned ', async () => {
        
        const config = {
            bucket: 'testBucket',
            parts: [],
            tmp: 'test'
        };

        const body =  {
            "size": 10,
            "query": {
                "bool": {
                    "must": {
                        "match_all": {}
                    }
                }
            }
        };
        
        const responsePayload = {
            _scroll_id: 'testScrollId',
            hits: {
                hits: []
            },
        };
        process.env.ES_PROXY = 'testFunction';
        lambdaMock.on(InvokeCommand).resolves({ Payload: JSON.stringify(responsePayload)});
        await load(config, body);
        expect(lambdaMock).toHaveReceivedCommandTimes(InvokeCommand, 1);
        expect(lambdaMock).toHaveReceivedCommandWith(InvokeCommand, {"FunctionName": "testFunction", "Payload": "{\"size\":10,\"query\":{\"bool\":{\"must\":{\"match_all\":{}}}}}"});
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 0);
        expect(config.status).toBe('Lex');
        expect(config.parts.length).toBe(0);
        expect(config.scroll_id).toBe('testScrollId');

	});

    it('should load data and update config when hits has source', async () => {

        const config = {
            bucket: 'testBucket',
            parts: [{ key: 'key1' }, { key: 'key2' }],
            tmp: 'test'
        };

        const body =  {
            "size": 1000,
            "_source": {
                "type": 'qna',
                "questions": [
                    {
                        "q" : "What is the capital of USA?",
                    }
                ],
                "exclude": [
                    "questions.q_vector",
                    "a_vector"
                ]
            },
            "query": {
                "bool": {
                    "must": {
                        "match_all": {}
                    }
                }
            }
        }
        
        const responsePayload = {
            _scroll_id: 'testScrollId2',
            hits: {
                hits: [
                    {
                    _source: {
                        type: 'qna',
                        questions: [
                            {
                                q : "What is the capital of USA?",
                            }
                        ],
                        exclude: [
                            "questions.q_vector",
                            "a_vector"
                        ]
                    }
                }
            ]
            },
        };
        process.env.ES_PROXY = 'testFunction';
        lambdaMock.on(InvokeCommand).resolves({ Payload: JSON.stringify(responsePayload)})
        s3Mock.on(PutObjectCommand).resolves({ VersionId: 'testVersionId' })
        await load(config, body);
        expect(config.status).toBe('InProgress');
        expect(config.parts).toHaveLength(3);
        expect(config.scroll_id).toBe('testScrollId2');
        expect(config.parts[0].key).toBeDefined();
        expect(lambdaMock).toHaveReceivedCommandTimes(InvokeCommand, 1);
        expect(lambdaMock).toHaveReceivedCommandWith(InvokeCommand, {"FunctionName": "testFunction", "Payload": "{\"size\":1000,\"_source\":{\"type\":\"qna\",\"questions\":[{\"q\":\"What is the capital of USA?\"}],\"exclude\":[\"questions.q_vector\",\"a_vector\"]},\"query\":{\"bool\":{\"must\":{\"match_all\":{}}}}}"});
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {"Body": "{\"type\":\"qna\",\"exclude\":[\"questions.q_vector\",\"a_vector\"],\"q\":[\"What is the capital of USA?\"]}", "Bucket": "testBucket", "Key": "test/3"});

	});

    it('should handle other type than qna', async () => {

        const config = {
            bucket: 'testBucket',
            parts: [],
            tmp: 'test'
        };

        const body =  {
            "size": 1000,
            "_source": {
                "type": 'someOtherType',
                "questions": [
                    {
                        "q" : "What is the capital of USA?",
                    }
                ],
                "exclude": [
                    "questions.q_vector",
                    "a_vector"
                ]
            },
            "query": {
                "bool": {
                    "must": {
                        "match_all": {}
                    }
                }
            }
        };
        
        const responsePayload = {
            _scroll_id: 'testScrollId3',
            hits: {
                hits: [
                    {
                    _source: {
                        type: 'someOtherType',
                        questions: [
                            {
                                q : "What is the capital of USA?",
                            }
                        ],
                        exclude: [
                            "questions.q_vector",
                            "a_vector"
                        ]
                    }
                }
            ]
            },
        };
        process.env.ES_PROXY = 'testFunction';
        lambdaMock.on(InvokeCommand).resolves({ Payload: JSON.stringify(responsePayload)});
        s3Mock.on(PutObjectCommand).resolves({ VersionId: 'testVersionId' });
        await load(config, body);
        expect(config.status).toBe('InProgress');
        expect(config.parts).toHaveLength(1);
        expect(config.scroll_id).toBe('testScrollId3');
        expect(lambdaMock).toHaveReceivedCommandTimes(InvokeCommand, 1);
        expect(lambdaMock).toHaveReceivedCommandWith(InvokeCommand, {"FunctionName": "testFunction", "Payload": "{\"size\":1000,\"_source\":{\"type\":\"someOtherType\",\"questions\":[{\"q\":\"What is the capital of USA?\"}],\"exclude\":[\"questions.q_vector\",\"a_vector\"]},\"query\":{\"bool\":{\"must\":{\"match_all\":{}}}}}"});
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {"Body": "{\"type\":\"someOtherType\",\"questions\":[{\"q\":\"What is the capital of USA?\"}],\"exclude\":[\"questions.q_vector\",\"a_vector\"]}", "Bucket": "testBucket", "Key": "test/1"});
	});

    it('should handle an error', async () => {

        const config = {
            bucket: 'testInvalidBucket',
            parts: [],
            tmp: 'testInvalid'
        };

        const body =  {
            "size": 1000,
            "_source": {
                "exclude": [
                    "questions.q_vector",
                    "a_vector"
                ]
            },
            "query": {
                "bool": {
                    "must": {
                        "match_all": {}
                    }
                }
            }
        }

        const error = new Error('load error');
        lambdaMock.on(InvokeCommand).rejects(error);
        await expect(load(config, body)).rejects.toThrowError(error);
	});
});