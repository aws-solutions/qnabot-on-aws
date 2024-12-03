/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */


const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');
const s3Mock = mockClient(S3Client);
require('aws-sdk-client-mock-jest');
const statusV2 = require('../../lib/statusv2');
const { sdkStreamMixin } = require('@smithy/util-stream');
const {Readable} = require('stream');

describe('When calling statusv2 function', () => {
    beforeEach(() => {
        s3Mock.reset();
        process.env.LEXV2_STATUS_KEY = 'testKey';
        process.env.STATUS_BUCKET = 'testBucket';
    });

    test('Should successfully send PutObjectCommand to s3 with no errors with status and message', async () => {
        const message = 'test-message';
        const status = 'success';
        const mockResponse = {
            'name': 'test-statusv2',
            'lastUpdatedDate': '12/03/2023',
            'createdDate': '10/27/2023',
            'version': '2.0'};

        const stream = new Readable();
        stream.push(JSON.stringify(mockResponse));
        stream.push(null);

        s3Mock.on(GetObjectCommand).resolves(
            {
                Body: sdkStreamMixin(stream)
            }
        );

        const verifyMessage = {};

        //Add status and message fields to mockResponse if required
        const statusAndMessageMock = jest.fn().mockImplementation(() => {
                if(message) verifyMessage.message=message;
                verifyMessage.status=status;
                return verifyMessage;
        })

        await statusV2(status, message);

        const putParams = {
            Body: "{\"name\":\"test-statusv2\",\"lastUpdatedDate\":\"12/03/2023\",\"createdDate\":\"10/27/2023\",\"version\":\"2.0\",\"message\":\"test-message\",\"status\":\"success\"}",
            Bucket: 'testBucket',
            Key: 'testKey'
        };
        expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {"Bucket": "testBucket", "Key": "testKey"});
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, putParams);

        //Verify Status and message present
        expect(statusAndMessageMock().status).toEqual(status);
        expect(statusAndMessageMock().message).toEqual(message)

    });

    test('Should successfully send PutObjectCommand to s3 with no errors with status only', async () => {
        const message = undefined;
        const status = 'success';
        const mockResponse = {
            'name': 'test-statusv2-noMessage',
            'lastUpdatedDate': '12/03/2023',
            'createdDate': '10/27/2023',
            'version': '2.0'};

        const stream = new Readable();
        stream.push(JSON.stringify(mockResponse));
        stream.push(null);

        s3Mock.on(GetObjectCommand).resolves(
            {
                Body: sdkStreamMixin(stream)
            }
        );

        const verifyMessage = {};

        //Add status and message fields to mockResponse if required
        const statusAndMessageMock = jest.fn().mockImplementation(() => {
                if(message) verifyMessage.message=message;
                verifyMessage.status=status;
                return verifyMessage;
        })

        await statusV2(status, message);

        const putParams = {
            Body: "{\"name\":\"test-statusv2-noMessage\",\"lastUpdatedDate\":\"12/03/2023\",\"createdDate\":\"10/27/2023\",\"version\":\"2.0\",\"status\":\"success\"}",
            Bucket: 'testBucket',
            Key: 'testKey'
        };
        expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {"Bucket": "testBucket", "Key": "testKey"});
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, putParams);

        //Verify Status and message present
        expect(statusAndMessageMock().status).toEqual(status);
        expect(statusAndMessageMock().message).toBeUndefined();
    });


    test('Should throw error', async () => {
        const message = 'test-message';
        const status = 'success';

        s3Mock.on(GetObjectCommand).rejects(new Error("Error with PutObject Command"));

        expect(async () => {
            await statusV2(status, message)
        }).rejects.toThrowError();

        expect(s3Mock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
        expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {"Bucket": "testBucket", "Key": "testKey"});
        expect(s3Mock).toHaveReceivedCommandTimes(PutObjectCommand, 0);
    });

});
