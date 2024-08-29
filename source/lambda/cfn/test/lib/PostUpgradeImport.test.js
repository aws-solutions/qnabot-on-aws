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
const originalEnv = process.env;
const postUpgradeImport = require('../../lib/PostUpgradeImport');
const postUpgradeImportFixtures = require('./PostUpgradeImport.fixtures');
const {Readable} = require('stream');
const { mockClient } = require('aws-sdk-client-mock');
const s3ClientMock = mockClient(S3Client);
const { sdkStreamMixin } = require('@smithy/util-stream');

describe('test PostUpgradeImport class', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
        };

        s3ClientMock.reset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // TODO: Should add tests to hit uncovered lines by mocking time elapsed for retries.
    // Also, more exception lines can be picked up with varying levels of GetObjecCommand
    // resolves, but these were omitted as I don't know how to get past the test timeout issues
    // because of not knowing how to mock elapsed time. 
    it("should be able to run import on Create", async () => {
        const postUpgradeImportCut = new postUpgradeImport();
        const s3InputObject = postUpgradeImportFixtures.s3InputObject();
        const params = postUpgradeImportFixtures.postUpgradeImportObject();

        const jsonData = { mock_data: 'mock_data_value' };
        const stream = new Readable();
        stream.push(JSON.stringify(jsonData));
        stream.push(null); // end of stream
        const sdkStream = sdkStreamMixin(stream);

        const jsonData2 = { status: "Complete" }; // status: Complete marks the end of the loop.
        const stream2 = new Readable();
        stream2.push(JSON.stringify(jsonData2));
        stream2.push(null); // end of stream
        const sdkStream2 = sdkStreamMixin(stream2);

        // Requires two stream mocks because this command is called twice and we need to parse the stream objects.
        s3ClientMock.on(GetObjectCommand).resolvesOnce({ Body: sdkStream }).resolvesOnce({ Body: sdkStream2 });
        s3ClientMock.on(PutObjectCommand).resolves(s3InputObject);

        const callback = (error, result) => {
            expect(result).toBe('PostUpgradeImport');
        };

        await postUpgradeImportCut.AsyncCreate(params, callback);
    });  

    it("should be equivalent to Create when Update is called", async () => {
        const postUpgradeImportCut = new postUpgradeImport();
        const s3InputObject = postUpgradeImportFixtures.s3InputObject();
        const params = postUpgradeImportFixtures.postUpgradeImportObject();

        const jsonData = { mock_data: 'mock_data_value' };
        const stream = new Readable();
        stream.push(JSON.stringify(jsonData));
        stream.push(null); // end of stream
        const sdkStream = sdkStreamMixin(stream);

        const jsonData2 = { status: "Complete" }; // status: Complete marks the end of the loop.
        const stream2 = new Readable();
        stream2.push(JSON.stringify(jsonData2));
        stream2.push(null); // end of stream
        const sdkStream2 = sdkStreamMixin(stream2);

        // Requires two stream mocks because this command is called twice and we need to parse the stream objects.
        s3ClientMock.on(GetObjectCommand).resolvesOnce({ Body: sdkStream }).resolvesOnce({ Body: sdkStream2 });
        s3ClientMock.on(PutObjectCommand).resolves(s3InputObject);

        const callback = (error, result) => {
            expect(result).toBe('PostUpgradeImport');
        };

        await postUpgradeImportCut.AsyncUpdate('mock_id', params, {}, callback);
    });

    it("should catch error and passthrough when s3 error occurs in Create", async () => {
        const postUpgradeImportCut = new postUpgradeImport();
        const s3InputObject = postUpgradeImportFixtures.s3InputObject();
        const params = postUpgradeImportFixtures.postUpgradeImportObject();

        s3ClientMock.on(GetObjectCommand).rejects('mock_error');
        s3ClientMock.on(PutObjectCommand).resolves(s3InputObject);

        const callback = (error, result) => {
            // Not properly exiting the GetObjectCommand will result in an exception, but this is an
            // expected possibility so the class catches and logs it, but does not actually throw an
            // error code.
            expect(result).toBe('PostUpgradeImport');
        };

        await postUpgradeImportCut.AsyncCreate(params, callback);
    });
});