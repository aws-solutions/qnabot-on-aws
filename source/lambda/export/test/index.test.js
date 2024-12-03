/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
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
                    key: "status-export/Export.csv",
                    versionId: "tLkWAhY8v2rsaSPWqg2m",
                }
            }
        }
    ]
};

function generateConfigAndVersionId(currentStatus) {
    const config = { status : currentStatus };
    const versionId = Math.random().toString(36).substring(3,9);
    return { config: config, versionId: versionId }
}

function initializeStartStepMocks() {
    const startConfig = generateConfigAndVersionId('Started');
    s3Mock.on(PutObjectCommand, {"Body": "{\"status\":\"Started\"}", "Bucket": "contentdesigneroutputbucket", "Key": "status-export/Export.csv"}).resolves(
    {
            '$metadata': {
              httpStatusCode: 200,
              requestId: '',
              extendedRequestId: '',
              cfId: undefined,
              attempts: 1,
              totalRetryDelay: 0
            },
            Expiration: '',
            ETag: '""',
            ServerSideEncryption: '',
            VersionId: startConfig.versionId
    })
    mockStream(startConfig.config, s3Mock, {"Bucket": "exportBucket", "Key": "status-export/Export.csv", "VersionId": "tLkWAhY8v2rsaSPWqg2m"})
    return { versionId: startConfig.versionId, config: startConfig.config }
}

function initializeInProgressStepMocks(startVersionId) {
    const stepConfig = generateConfigAndVersionId('InProgress');
    s3Mock.on(PutObjectCommand, {"Body": "{\"status\":\"InProgress\"}", "Bucket": "contentdesigneroutputbucket", "Key": "status-export/Export.csv"}).resolves(
    {
            '$metadata': {
              httpStatusCode: 200,
              requestId: '',
              extendedRequestId: '',
              cfId: undefined,
              attempts: 1,
              totalRetryDelay: 0
            },
            Expiration: '',
            ETag: '""',
            ServerSideEncryption: '',
            VersionId: stepConfig.versionId
    })
    mockStream(stepConfig.config, s3Mock, {"Bucket": "contentdesigneroutputbucket", "Key": "status-export/Export.csv", "VersionId": startVersionId});
    return { versionId: stepConfig.versionId, config: stepConfig.config }
}

function initializeJoinStepMocks(inProgressVersionId) {
    const joinConfig = generateConfigAndVersionId('Join');
    s3Mock.on(PutObjectCommand, {"Body": "{\"status\":\"Join\"}", "Bucket": "contentdesigneroutputbucket", "Key": "status-export/Export.csv"}).resolves(
    {
            '$metadata': {
              httpStatusCode: 200,
              requestId: '',
              extendedRequestId: '',
              cfId: undefined,
              attempts: 1,
              totalRetryDelay: 0
            },
            Expiration: '',
            ETag: '""',
            ServerSideEncryption: '',
            VersionId: joinConfig.versionId
    })
    mockStream(joinConfig.config, s3Mock, {"Bucket": "contentdesigneroutputbucket", "Key": "status-export/Export.csv", "VersionId": inProgressVersionId});
    return { versionId: joinConfig.versionId, config: joinConfig.config }
}

function initializeCleanStepMocks(lexVersionId) {
    const cleanConfig = generateConfigAndVersionId('Clean');
    s3Mock.on(PutObjectCommand, {"Body": "{\"status\":\"Clean\"}", "Bucket": "contentdesigneroutputbucket", "Key": "status-export/Export.csv"}).resolves(
    {
            '$metadata': {
              httpStatusCode: 200,
              requestId: '',
              extendedRequestId: '',
              cfId: undefined,
              attempts: 1,
              totalRetryDelay: 0
            },
            Expiration: '',
            ETag: '""',
            ServerSideEncryption: '',
            VersionId: cleanConfig.versionId
    })
    mockStream(cleanConfig.config, s3Mock, {"Bucket": "contentdesigneroutputbucket", "Key": "status-export/Export.csv", "VersionId": lexVersionId});
    return { versionId: cleanConfig.versionId, config: cleanConfig.config }
}

describe('when calling index function', () => {

    beforeEach(() => {
        s3Mock.reset();
    });
    
    afterEach(() => {
        s3Mock.restore();
        jest.clearAllMocks();
    });

    it('should call the different steps and update status as expected', async () => {
        const startStepInfo = initializeStartStepMocks();
        const inProgressStepInfo = initializeInProgressStepMocks(startStepInfo.versionId);
        const joinStepInfo = initializeJoinStepMocks(inProgressStepInfo.versionId);
        const cleanStepInfo = initializeCleanStepMocks(joinStepInfo.versionId);
        await index.step(event, null, jest.fn());
        expect(start).toHaveBeenCalledTimes(1);
        expect(start).toHaveBeenCalledWith(startStepInfo.config);
        expect(s3Mock).toHaveReceivedNthSpecificCommandWith(1,GetObjectCommand, {"Bucket": "exportBucket", "Key": "status-export/Export.csv", "VersionId": "tLkWAhY8v2rsaSPWqg2m"});
        expect(s3Mock).toHaveReceivedNthSpecificCommandWith(1,PutObjectCommand, {"Body": "{\"status\":\"Started\"}", "Bucket": "contentdesigneroutputbucket", "Key": "status-export/Export.csv"});
        expect(step).toHaveBeenCalledTimes(1);
        expect(step).toHaveBeenCalledWith(inProgressStepInfo.config);
        expect(s3Mock).toHaveReceivedNthSpecificCommandWith(2,GetObjectCommand, {"Bucket": "contentdesigneroutputbucket", "Key": "status-export/Export.csv", "VersionId": startStepInfo.versionId});
        expect(s3Mock).toHaveReceivedNthSpecificCommandWith(2,PutObjectCommand, {"Body": "{\"status\":\"InProgress\"}", "Bucket": "contentdesigneroutputbucket", "Key": "status-export/Export.csv"});
        expect(join).toHaveBeenCalledTimes(1);
        expect(join).toHaveBeenCalledWith(joinStepInfo.config);
        expect(s3Mock).toHaveReceivedNthSpecificCommandWith(3,GetObjectCommand, {"Bucket": "contentdesigneroutputbucket", "Key": "status-export/Export.csv", "VersionId": inProgressStepInfo.versionId});
        expect(s3Mock).toHaveReceivedNthSpecificCommandWith(3,PutObjectCommand, {"Body": "{\"status\":\"Join\"}", "Bucket": "contentdesigneroutputbucket", "Key": "status-export/Export.csv"});
        expect(clean).toHaveBeenCalledTimes(1);
        expect(clean).toHaveBeenCalledWith(cleanStepInfo.config);
        expect(s3Mock).toHaveReceivedNthSpecificCommandWith(4,GetObjectCommand, {"Bucket": "contentdesigneroutputbucket", "Key": "status-export/Export.csv", "VersionId": joinStepInfo.versionId});
        expect(s3Mock).toHaveReceivedNthSpecificCommandWith(4,PutObjectCommand, {"Body": "{\"status\":\"Clean\"}", "Bucket": "contentdesigneroutputbucket", "Key": "status-export/Export.csv"});
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