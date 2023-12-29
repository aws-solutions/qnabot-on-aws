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

const { mockClient } = require('aws-sdk-client-mock');
const { S3Client, ListObjectVersionsCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const originalEnv = process.env;
const s3ClearFixtures = require('./S3Clear.fixtures');
const s3Clear = require('../../lib/S3Clear');
const s3ClientMock = mockClient(S3Client);

describe('test S3Clear class', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
        };

        s3ClientMock.reset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // TODO: Add more tests around the different points of failures that don't fail due to retry limit.
    it("should be able to run import on Create", async () => {
        const s3ClearCut = new s3Clear();
        const params = s3ClearFixtures.s3BucketObject();
        const listObjectVersionsCommandObject = s3ClearFixtures.listObjectVersionsCommandObject();
        const deleteObjectsCommandObject = s3ClearFixtures.deleteObjectsCommandObject();
        
        s3ClientMock.on(ListObjectVersionsCommand).resolves(listObjectVersionsCommandObject);
        s3ClientMock.on(DeleteObjectsCommand).resolves(deleteObjectsCommandObject);
        
        const callback = (error, result) => {
            expect(result).toBe('mock_id'); 
        };

        await s3ClearCut.Delete('mock_id', params, callback);
    });
});