/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

require('aws-sdk-client-mock-jest');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');
const s3ClientMock = mockClient(S3Client);
const lambdaClientMock = mockClient(LambdaClient);
const crypto = require('crypto');
const { handler } = require('../start');

jest.mock('crypto', () => ({
    randomBytes: jest.fn().mockImplementation(() => Buffer.from('', 'utf8')),
}));

describe('lex poll', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        s3ClientMock.reset();
        lambdaClientMock.reset();
        process.env = { ...OLD_ENV };
    });

    it('initializes lex v2 and updates s3', async () => {
        process.env.STATUS_BUCKET = 'test-bucket';
        process.env.LEXV2_STATUS_KEY = 'test-status-key';
        process.env.BUILD_FUNCTION = 'test-lambda';

        s3ClientMock
            .on(PutObjectCommand)
            .resolves({});
        lambdaClientMock.on(InvokeCommand).resolves({});

        const mockCallback = jest.fn();

        await handler({}, {}, mockCallback);

        expect(s3ClientMock).toHaveReceivedNthCommandWith(1, PutObjectCommand, {
            Bucket: 'test-bucket',
            Key: process.env.LEXV2_STATUS_KEY,
            Body: JSON.stringify({
                status: 'Starting',
                token: '',
            }),
        });
        expect(lambdaClientMock).toHaveReceivedCommandWith(InvokeCommand, {
            FunctionName: process.env.BUILD_FUNCTION,
            InvocationType: 'Event',
            Payload: '{}',
        });
        expect(mockCallback).toHaveBeenCalledWith(null, { token: '' });
    });

    it('only initializes lex v2 if v2 status key not set', async () => {
        process.env.STATUS_BUCKET = 'test-bucket';
        process.env.STATUS_KEY = '';
        process.env.LEXV2_STATUS_KEY = 'test-status-key';
        process.env.BUILD_FUNCTION = 'test-lambda';

        s3ClientMock
            .on(PutObjectCommand)
            .resolves({});
        lambdaClientMock.on(InvokeCommand).resolves({});

        const mockCallback = jest.fn();

        await handler({}, {}, mockCallback);

        expect(s3ClientMock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
        expect(lambdaClientMock).toHaveReceivedCommandWith(InvokeCommand, {
            FunctionName: process.env.BUILD_FUNCTION,
            InvocationType: 'Event',
            Payload: '{}',
        });
        expect(mockCallback).toHaveBeenCalledWith(null, { token: '' });
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });
});
