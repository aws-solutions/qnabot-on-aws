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
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
const originalEnv = process.env;
const s3VersionFixtures = require('./S3Version.fixtures');
const s3Version = require('../../lib/S3Version');
const s3ClientMock = mockClient(S3Client);

describe('test S3Version class', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
        };

        s3ClientMock.reset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be able to get versionId if found on Create", async () => {
        const s3VersionCut = new s3Version();
        const params = s3VersionFixtures.s3BucketObject();
        const headObjectCommandObject = s3VersionFixtures.headObjectCommandObject();
        
        s3ClientMock.on(HeadObjectCommand).resolves(headObjectCommandObject);
        
        const callback = (error, result) => {
            expect(result).toBe('3');
        };

        await s3VersionCut.Create(params, callback);
    });          
    
    it("should be able to get default versionId if not found on Create", async () => {
        const s3VersionCut = new s3Version();
        const params = s3VersionFixtures.s3BucketObject();
        
        s3ClientMock.on(HeadObjectCommand).resolves();
        
        const callback = (error, result) => {
            expect(result).toBe('1');
        };

        await s3VersionCut.Create(params, callback);
    });      
    
    it("should be equivalent to Create when Update is called", async () => {
        const s3VersionCut = new s3Version();
        const params = s3VersionFixtures.s3BucketObject();
        
        s3ClientMock.on(HeadObjectCommand).resolves();
        
        const callback = (error, result) => {
            expect(result).toBe('1');
        };

        await s3VersionCut.Update('mock_id', params, {}, callback);
    }); 

    it("should catch error in Create and passthrough", async () => {
        const s3VersionCut = new s3Version();
        const params = s3VersionFixtures.s3BucketObject();
        
        s3ClientMock.on(HeadObjectCommand).rejects('mock_error');
        
        const callback = (error, result) => {
            expect(error.message).toBe('mock_error');
        };

        await s3VersionCut.Create(params, callback);
    }); 
});