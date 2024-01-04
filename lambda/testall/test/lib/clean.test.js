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
const clean = require('../../lib/clean');
const { mockClient } = require('aws-sdk-client-mock');
const { S3Client, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const s3Mock = mockClient(S3Client);
require('aws-sdk-client-mock-jest');

describe('when calling clean function', () => {

    beforeEach(() => {
        s3Mock.reset();
    });

    afterEach(() => {
        s3Mock.restore();
    });

    it("should clean objects and return status Completed", async () => {
        const config = {
            bucket: 'testBucket',
            parts: [{ key: 'key1' }, { key: 'key2' }],
            version: 'testVersion'
        };
        s3Mock.on(DeleteObjectsCommand).resolves({});
        await clean(config);
        expect(config.status).toBe('Completed');
        expect(s3Mock).toHaveReceivedCommandTimes(DeleteObjectsCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectsCommand, {"Bucket": "testBucket", "Delete": {"Objects": [{"Key": "key1", "VersionId": "testVersion"}, {"Key": "key2", "VersionId": "testVersion"}], "Quiet": true}});

	});

    it("should an handle an error", async () => {
        const config = {
            bucket: 'invalidBucket',
            parts: [{ key: 'invalidKey' }],
            version: 'invalidVersion'
        };
        s3Mock.on(DeleteObjectsCommand).rejects(new Error('Invalid Error'));
        await expect(clean(config)).rejects.toThrowError('Invalid Error');
        expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectsCommand, {"Bucket": "invalidBucket", "Delete": {"Objects": [{"Key": "invalidKey", "VersionId": "invalidVersion"}], "Quiet": true}});
        expect(s3Mock).toHaveReceivedCommandTimes(DeleteObjectsCommand, 1);
	});

    it("should handle empty parts", async () => {
        const config = {
            bucket: 'testBucket',
            parts: [],
            version: 'testVersion'
        }
        await clean(config);
        expect(clean.status).toBe(undefined);
        expect(s3Mock).toHaveReceivedCommandTimes(DeleteObjectsCommand, 0);
	});
});

  