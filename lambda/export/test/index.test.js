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
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');
const { mockStream } = require('../test/index.fixtures');
const s3Mock = mockClient(S3Client);
require('aws-sdk-client-mock-jest');

jest.mock('../lib/start');
jest.mock('../lib/load');
jest.mock('../lib/join');
jest.mock('../lib/step');
jest.mock('../lib/clean');

const start = require('../lib/start');
const join = require('../lib/join');
const step = require('../lib/step');
const clean = require('../lib/clean');
const index = require('../index');

const event = {
    Records: [
        {
            s3: {
                bucket: {
                    name: "exportBucket",
                },
                object: {
                    key: "status/Export.csv",
                    versionId: "tLkWAhY8v2rsaSPWqg2m",
                }
            }
        }
    ]
};

describe('when calling index function', () => {

    beforeEach(() => {
        s3Mock.reset();
    });
    
    afterEach(() => {
        s3Mock.restore();
        jest.clearAllMocks();
    });

    it('should call start and update status correctly', async () => {
        const config = { status : 'Started' };
        mockStream(config, s3Mock);
        await index.step(event, null, jest.fn());
        expect(start).toHaveBeenCalledTimes(1);
        expect(start).toHaveBeenCalledWith(config);
        expect(step).toHaveBeenCalledTimes(0);
        expect(join).toHaveBeenCalledTimes(0);
        expect(clean).toHaveBeenCalledTimes(0);
        expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {"Bucket": "exportBucket", "Key": "status/Export.csv", "VersionId": "tLkWAhY8v2rsaSPWqg2m"});
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {"Body": "{\"status\":\"Started\"}", "Bucket": "exportBucket", "Key": "status/Export.csv"});
    });

    it('should call step and update status correctly', async () => {
        const config = { status : 'InProgress' };
        mockStream(config, s3Mock);
        await index.step(event, null, jest.fn());
        expect(step).toHaveBeenCalledTimes(1);
        expect(step).toHaveBeenCalledWith(config);
        expect(join).toHaveBeenCalledTimes(0);
        expect(clean).toHaveBeenCalledTimes(0);
        expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {"Bucket": "exportBucket", "Key": "status/Export.csv", "VersionId": "tLkWAhY8v2rsaSPWqg2m"});
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {"Body": "{\"status\":\"InProgress\"}", "Bucket": "exportBucket", "Key": "status/Export.csv"});
    });

    it('should call join and update status correctly', async () => {
        const config = { status : 'Join' };
        mockStream(config, s3Mock);
        await index.step(event, null, jest.fn());
        expect(join).toHaveBeenCalledTimes(1);
        expect(join).toHaveBeenCalledWith(config);
        expect(clean).toHaveBeenCalledTimes(0);
        expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {"Bucket": "exportBucket", "Key": "status/Export.csv", "VersionId": "tLkWAhY8v2rsaSPWqg2m"});
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {"Body": "{\"status\":\"Join\"}", "Bucket": "exportBucket", "Key": "status/Export.csv"});
    });

    it('should call clean and update status correctly', async () => {
        const config = { status : 'Clean' };
        mockStream(config, s3Mock);
        await index.step(event, null, jest.fn());
        expect(clean).toHaveBeenCalledTimes(1);
        expect(clean).toHaveBeenCalledWith(config);
        expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {"Bucket": "exportBucket", "Key": "status/Export.csv", "VersionId": "tLkWAhY8v2rsaSPWqg2m"});
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {"Body": "{\"status\":\"Clean\"}", "Bucket": "exportBucket", "Key": "status/Export.csv"});
    });

    it('should handle an error', async () => {
        const error = new Error('test error');
        s3Mock.on(GetObjectCommand).rejects(error);
        const mockFn = jest.fn();
        await index.step(event, null, mockFn);
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith(error);
    });
});