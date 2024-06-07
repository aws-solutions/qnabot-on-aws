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
const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const originalEnv = process.env;
const preUpgradeExport = require('../../lib/PreUpgradeExport');
const preUpgradeExportFixtures = require('./PreUpgradeExport.fixtures');
const { Readable } = require('stream');
const s3ClientMock = mockClient(S3Client);
const { sdkStreamMixin } = require('@smithy/util-stream');
const fs = require('fs');

// jest.spyOn(global, 'setTimeout');

describe('test PreUpgradeExport class', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
        };

        s3ClientMock.reset();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    // TODO: Should add tests to hit uncovered lines by mocking time elapsed for retries. Also need
    // more coverage to hit the caught exception lines.
    it("should be able to run import on Create", async () => {
        const preUpgradeExportCut = new preUpgradeExport();
        const s3InputObject = preUpgradeExportFixtures.s3InputObject();
        const params = preUpgradeExportFixtures.preUpgradeExportObject();
        
        const jsonData = { status: "Completed" };
        const stream = new Readable();
        stream.push(JSON.stringify(jsonData));
        stream.push(null); // end of stream
        const sdkStream = sdkStreamMixin(stream);
        
        s3ClientMock.on(GetObjectCommand).resolves({ Body: sdkStream });
        s3ClientMock.on(PutObjectCommand).resolves(s3InputObject);

        const callback = (error, result) => {
            expect(result).toBe('PreUpgradeExport'); 
        };

        await preUpgradeExportCut.Create(params, callback);
    });  

    it("should be equivalent to Create when Update is called", async () => {
        const preUpgradeExportCut = new preUpgradeExport();
        const s3InputObject = preUpgradeExportFixtures.s3InputObject();
        const params = preUpgradeExportFixtures.preUpgradeExportObject();
        
        const jsonData = { status: "Completed" };
        const stream = new Readable();
        stream.push(JSON.stringify(jsonData));
        stream.push(null); // end of stream
        const sdkStream = sdkStreamMixin(stream);
        
        s3ClientMock.on(GetObjectCommand).resolves({ Body: sdkStream });
        s3ClientMock.on(PutObjectCommand).resolves(s3InputObject);

        const callback = (error, result) => {
            expect(result).toBe('PreUpgradeExport'); 
        };
        
        await preUpgradeExportCut.Update('mock_id', params, {}, callback);
    });
});