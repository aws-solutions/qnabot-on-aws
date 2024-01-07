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
const { mockStream } = require('../../test/index.fixtures');
const { mockClient } = require('aws-sdk-client-mock');
const s3Mock = mockClient(S3Client);
const join = require('../../lib/join');
require('aws-sdk-client-mock-jest');

describe('when calling join function', () => {
    
    beforeEach(() => {
        s3Mock.reset();
    });

    afterEach(() => {
        s3Mock.restore();
    });

    it('should join parts and put object in s3', async () => {
        const config = {
            bucket: 'testBucket',
            key: 'testKey',
            parts: [{ key : 'testPart1' } , { key : 'testPart2' }],
            version: 'testVersion'
        };
        mockStream(config, s3Mock);
        await join(config);
        expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 2);
        expect(s3Mock).toHaveReceivedNthCommandWith(1, GetObjectCommand, {"Bucket": "testBucket", "Key": "testPart1", "VersionId": "testVersion"});
        expect(s3Mock).toHaveReceivedNthCommandWith(2, GetObjectCommand, {"Bucket": "testBucket", "Key": "testPart2", "VersionId": "testVersion"});
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {"Body": '{"bucket":"testBucket","key":"testKey","parts":[{"key":"testPart1"},{"key":"testPart2"}],"version":"testVersion"}\n'});
        expect(config.status).toBe('Clean');

	});

    it('should handle an error', async () => {

        const config = {
            bucket: 'testInvalidBucket',
            key: 'testInvalidKey',
            parts: [{ key : 'testInvalidPart'}],
            version: 'testInvalidVersion'
        };

        const error = new Error('load error');
        s3Mock.on(GetObjectCommand).rejects(error);
        await expect(join(config)).rejects.toThrowError(error);
	});
});