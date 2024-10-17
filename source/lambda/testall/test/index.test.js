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
jest.mock('../lib/lex');
jest.mock('../lib/step');
jest.mock('../lib/clean');

const start = require('../lib/start');
const lex = require('../lib/lex');
const step = require('../lib/step');
const clean = require('../lib/clean');
const index = require('../index');

const event = {
    Records: [
        {
            s3: {
                bucket: {
                    name: "testallbucket",
                },
                object: {
                    key: "status-testall/TestAll.csv",
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
    s3Mock.on(PutObjectCommand, {"Body": "{\"status\":\"Started\"}", "Bucket": "contentdesigneroutputbucket", "Key": "status-testall/TestAll.csv"}).resolves(
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
    mockStream(startConfig.config, s3Mock, {"Bucket": "testallbucket", "Key": "status-testall/TestAll.csv", "VersionId": "tLkWAhY8v2rsaSPWqg2m"})
    return { versionId: startConfig.versionId, config: startConfig.config }
}

function initializeInProgressStepMocks(startVersionId) {
    const stepConfig = generateConfigAndVersionId('InProgress');
    s3Mock.on(PutObjectCommand, {"Body": "{\"status\":\"InProgress\"}", "Bucket": "contentdesigneroutputbucket", "Key": "status-testall/TestAll.csv"}).resolves(
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
    mockStream(stepConfig.config, s3Mock, {"Bucket": "contentdesigneroutputbucket", "Key": "status-testall/TestAll.csv", "VersionId": startVersionId});
    return { versionId: stepConfig.versionId, config: stepConfig.config }
}

function initializeLexStepMocks(inProgressVersionId) {
    const lexConfig = generateConfigAndVersionId('Lex');
    s3Mock.on(PutObjectCommand, {"Body": "{\"status\":\"Lex\"}", "Bucket": "contentdesigneroutputbucket", "Key": "status-testall/TestAll.csv"}).resolves(
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
            VersionId: lexConfig.versionId
    })
    mockStream(lexConfig.config, s3Mock, {"Bucket": "contentdesigneroutputbucket", "Key": "status-testall/TestAll.csv", "VersionId": inProgressVersionId});
    return { versionId: lexConfig.versionId, config: lexConfig.config }
}

function initializeCleanStepMocks(lexVersionId) {
    const cleanConfig = generateConfigAndVersionId('Clean');
    s3Mock.on(PutObjectCommand, {"Body": "{\"status\":\"Clean\"}", "Bucket": "contentdesigneroutputbucket", "Key": "status-testall/TestAll.csv"}).resolves(
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
    mockStream(cleanConfig.config, s3Mock, {"Bucket": "contentdesigneroutputbucket", "Key": "status-testall/TestAll.csv", "VersionId": lexVersionId});
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
        const lexStepInfo = initializeLexStepMocks(inProgressStepInfo.versionId);
        const cleanStepInfo = initializeCleanStepMocks(lexStepInfo.versionId);
        await index.step(event, null, jest.fn());
        expect(start).toHaveBeenCalledTimes(1);
        expect(start).toHaveBeenCalledWith(startStepInfo.config);
        expect(s3Mock).toHaveReceivedNthSpecificCommandWith(1, GetObjectCommand, {"Bucket": "testallbucket", "Key": "status-testall/TestAll.csv", "VersionId": "tLkWAhY8v2rsaSPWqg2m"});
        expect(s3Mock).toHaveReceivedNthSpecificCommandWith(1, PutObjectCommand, {"Body": "{\"status\":\"Started\"}", "Bucket": "contentdesigneroutputbucket", "Key": "status-testall/TestAll.csv"});
        expect(step).toHaveBeenCalledTimes(1);
        expect(step).toHaveBeenCalledWith(inProgressStepInfo.config);
        expect(s3Mock).toHaveReceivedNthSpecificCommandWith(2, GetObjectCommand, {"Bucket": "contentdesigneroutputbucket", "Key": "status-testall/TestAll.csv", "VersionId": startStepInfo.versionId});
        expect(s3Mock).toHaveReceivedNthSpecificCommandWith(2, PutObjectCommand, {"Body": "{\"status\":\"InProgress\"}", "Bucket": "contentdesigneroutputbucket", "Key": "status-testall/TestAll.csv"});
        expect(lex).toHaveBeenCalledTimes(1);
        expect(lex).toHaveBeenCalledWith(lexStepInfo.config);
        expect(s3Mock).toHaveReceivedNthSpecificCommandWith(3, GetObjectCommand, {"Bucket": "contentdesigneroutputbucket", "Key": "status-testall/TestAll.csv", "VersionId": inProgressStepInfo.versionId});
        expect(s3Mock).toHaveReceivedNthSpecificCommandWith(3, PutObjectCommand, {"Body": "{\"status\":\"Lex\"}", "Bucket": "contentdesigneroutputbucket", "Key": "status-testall/TestAll.csv"});
        expect(clean).toHaveBeenCalledTimes(1);
        expect(clean).toHaveBeenCalledWith(cleanStepInfo.config);
        expect(s3Mock).toHaveReceivedNthSpecificCommandWith(4,GetObjectCommand, {"Bucket": "contentdesigneroutputbucket", "Key": "status-testall/TestAll.csv", "VersionId": lexStepInfo.versionId});
        expect(s3Mock).toHaveReceivedNthSpecificCommandWith(4, PutObjectCommand, {"Body": "{\"status\":\"Clean\"}", "Bucket": "contentdesigneroutputbucket", "Key": "status-testall/TestAll.csv"});
    });

    it('should handle an error', async () => {
        const error = new Error('test error');
        s3Mock.on(GetObjectCommand).rejects(error);
        const mockFn = jest.fn();
        await index.step(event, null, mockFn);
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith(error);
    });
})

