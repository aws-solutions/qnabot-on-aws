/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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

        await preUpgradeExportCut.AsyncCreate(params, callback);
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
        
        await preUpgradeExportCut.AsyncUpdate('mock_id', params, {}, callback);
    });
});