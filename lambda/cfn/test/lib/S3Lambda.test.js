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
const { S3Client, PutBucketNotificationConfigurationCommand } = require('@aws-sdk/client-s3');
const originalEnv = process.env;
const s3LambdaFixtures = require('./S3Lambda.fixtures');
const s3Lambda = require('../../lib/S3Lambda');
const { nativePromise } = require('../../lib/util/promise');
const s3ClientMock = mockClient(S3Client);

describe('test S3Lambda class', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
        };

        s3ClientMock.reset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // TODO: These tests aren't currently testing any functionality as I'm unsure of how to mock
    // the return value of nativePromise.retry() to therefore catch the .then() and .catch() paths. 
    it("should be able to run create new bucket notification configuration on Create", async () => {
        const s3LambdaCut = new s3Lambda();
        const params = s3LambdaFixtures.s3BucketObject();
        // const nativePromiseSpy = jest.spyOn(nativePromise.prototype, 'nativePromise');
        
        s3ClientMock.on(PutBucketNotificationConfigurationCommand).resolves({});
        
        const callback = (error, result) => {
            // expect(nativePromiseSpy).toHaveBeenCalledTimes(0);
            // expect(result).toBeNull();
        };

        await s3LambdaCut.Create(params, callback);
    });  
    
    it("should be equivalent to Create when Update is called", async () => {
        const s3LambdaCut = new s3Lambda();
        const params = s3LambdaFixtures.s3BucketObject();
        // const nativePromiseSpy = jest.spyOn(nativePromise.prototype, 'nativePromise');
        
        s3ClientMock.on(PutBucketNotificationConfigurationCommand).resolves({});
        
        const callback = (error, result) => {
            // expect(nativePromiseSpy).toHaveBeenCalledTimes(0);
            // expect(result).toBeNull();
        };

        await s3LambdaCut.Update('mock_id', params, {}, callback);
    });  

    it("should do nothing when Delete is called", async () => {
        const s3LambdaCut = new s3Lambda();
        const params = s3LambdaFixtures.s3BucketObject();
        
        const callback = (error, result) => {
            // expect(result).toBeNull();
        };

        await s3LambdaCut.Delete('mock_id', params, callback);
    });  
});