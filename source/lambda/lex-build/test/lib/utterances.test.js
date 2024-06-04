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


const utterances = require('../../lib/utterances');
const { con } = require('/opt/opensearch-client/connection');
const esFixtures = require('./es.fixtures');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');
const { Readable } = require('stream');
const { sdkStreamMixin } = require('@smithy/util-stream');
const s3Mock = mockClient(S3Client);
require('aws-sdk-client-mock-jest');
jest.mock('/opt/opensearch-client/connection');

describe('When calling utterances function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        s3Mock.reset();
        process.env.INDEX = 'test-index';
        process.env.UTTERANCE_BUCKET = 'test-bucket';
        process.env.UTTERANCE_KEY = 'test-key';
        process.env.ADDRESS = 'test-address';
    });

    test('Should return combined utterances successfully', async () => {
        const params = {
            address: 'test-address'
        };

        const mockEs = jest.fn().mockImplementation(() => {
            return esFixtures.returnEsMock('qna');
        });
        const mockResponse = mockEs();

        con.mockImplementation(() => {
            return mockResponse;
        });

        const s3MockResponse = 'Sample Mock question from S3';

        const stream = new Readable();
        stream.push(JSON.stringify(s3MockResponse));
        stream.push(null);

        s3Mock.on(GetObjectCommand).resolves(
            {
                Body: sdkStreamMixin(stream)
            }
        );

        const combinedUtterances = await utterances(params);

        expect(con).toBeCalledTimes(1);
        expect(con).toBeCalledWith('test-address');
        expect(mockResponse.search).toHaveBeenCalledTimes(1);
        expect(mockResponse.search).toHaveBeenCalledWith({"body": {"query": {"match_all": {}}}, "index": "test-index", "scroll": "10s"});
        expect(mockResponse.scroll).toHaveBeenCalledTimes(2);
        expect(mockResponse.scroll).toHaveBeenCalledWith({"scroll": "10s", "scrollId": "1.0"});

        expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {"Bucket": "test-bucket", "Key": "test-key"});

        //Total size of combinedUtterances is 5, 2 from search, 2 from scroll and 1 from s3
        expect(combinedUtterances.length).toEqual(5);
        expect(combinedUtterances[0]).toEqual('What is QnABot?');
        expect(combinedUtterances[1]).toEqual('How is weather today?');
        expect(combinedUtterances[2]).toEqual('What is best place to see northern lights?');
        expect(combinedUtterances[3]).toEqual('What is Best Indian restaurant in US?');
        expect(combinedUtterances[4]).toEqual('Sample Mock question from S3');
    });
})
