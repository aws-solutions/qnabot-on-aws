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
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const originalEnv = process.env;
const s3UnzipFixtures = require('./S3Unzip.fixtures');
const s3Unzip = require('../../lib/S3Unzip');
const { Readable } = require('stream');
const { sdkStreamMixin } = require('@smithy/util-stream');
const JSZip = require('jszip');
JSZip.external.Promise = global.Promise;
const s3ClientMock = mockClient(S3Client);

describe('test S3Unzip class', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
        };

        s3ClientMock.reset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be able to run create new bucket notification configuration on Create", async () => {
        const s3UnzipCut = new s3Unzip();
        const params = s3UnzipFixtures.s3GetObjectCommand();
        const s3BucketObject = s3UnzipFixtures.s3BucketObject();
        const jsZipSpyObject = s3UnzipFixtures.jsZipSpyObject();

        const jsZipSpy = jest.spyOn(JSZip.prototype, 'loadAsync').mockReturnValue(jsZipSpyObject);
        
        const stream = new Readable();
        stream.push(JSON.stringify(s3BucketObject));
        stream.push(null); // end of stream
        const sdkStream = sdkStreamMixin(stream);
        
        // TODO: Mock:
        //   const content = await jszip.file(file).async('nodebuffer'); 
        // return value to execute remaining code in Create.
        s3ClientMock.on(GetObjectCommand).resolves({ Body: sdkStream });
        s3ClientMock.on(PutObjectCommand).resolves(params);
        
        const callback = (error, result) => {
            expect(result).toBe('mock_source_bucket/mock_key');
        };

        await s3UnzipCut.Create(params, callback);

        expect(jsZipSpy).toHaveBeenCalled();
    });      
    
    it("should be equivalent to Create when Update is called", async () => {
        const s3UnzipCut = new s3Unzip();
        const params = s3UnzipFixtures.s3GetObjectCommand();
        const s3BucketObject = s3UnzipFixtures.s3BucketObject();
        const jsZipSpyObject = s3UnzipFixtures.jsZipSpyObject();

        const jsZipSpy = jest.spyOn(JSZip.prototype, 'loadAsync').mockReturnValue(jsZipSpyObject);
        
        const stream = new Readable();
        stream.push(JSON.stringify(s3BucketObject));
        stream.push(null); // end of stream
        const sdkStream = sdkStreamMixin(stream);
        
        // TODO: Mock:
        //   const content = await jszip.file(file).async('nodebuffer'); 
        // return value to execute remaining code in Create.
        s3ClientMock.on(GetObjectCommand).resolves({ Body: sdkStream });
        s3ClientMock.on(PutObjectCommand).resolves(params);
        
        const callback = (error, result) => {
            expect(result).toBe('mock_source_bucket/mock_key');
        };

        await s3UnzipCut.Update('mock_id', params, {}, callback);

        expect(jsZipSpy).toHaveBeenCalled();
    }); 

    it("should catch error in Create and passthrough", async () => {
        const s3UnzipCut = new s3Unzip();
        const params = s3UnzipFixtures.s3GetObjectCommand();
        
        const callback = (error, result) => {
            expect(result).toBe('mock_source_bucket/mock_key');
        };

        // No resolved mocks cause an exception to occur due to retrieval of attributes on null object.
        await s3UnzipCut.Create(params, callback);
    }); 

    it("should be return ID when Delete is called but do nothing", async () => {
        const s3UnzipCut = new s3Unzip();
        const params = s3UnzipFixtures.s3GetObjectCommand();

        const callback = (error, result) => {
            expect(result).toBe('mock_id');
        };

        await s3UnzipCut.Delete('mock_id', params, callback);
    });
});