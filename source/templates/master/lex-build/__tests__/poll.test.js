/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

require('aws-sdk-client-mock-jest');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { LexModelBuildingServiceClient, GetBotCommand } = require('@aws-sdk/client-lex-model-building-service');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');
const s3ClientMock = mockClient(S3Client);
const lexClientMock = mockClient(LexModelBuildingServiceClient);
const lambdaClientMock = mockClient(LambdaClient);
const { handler } = require('../poll');
const fs = require('fs');

const context = {};
const callback = (error, response) => {};
const event = {
    dummy: 'test',
};

describe('lex poll', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        s3ClientMock.reset();
        lexClientMock.reset();
        lambdaClientMock.reset();
        process.env = { ...OLD_ENV };
    });

    it('updates the lex status in S3 after polling lex', async () => {
        const lexStatusFromS3 = {
            Body: fs.createReadStream('./master/lex-build/__tests__/test.json'),
        };
        const lexStatusFromLex = {
            status: 'BUILDING',
        };

        process.env.STATUS_BUCKET = 'test-bucket';
        process.env.STATUS_KEY = 'test-key';
        process.env.BOT_NAME = 'test-bot';
        process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-lambda';

        jest
            .spyOn(global, 'setTimeout')
            .mockImplementation(async (cb) => (typeof cb === 'function' ? cb() : null));

        s3ClientMock
            .on(GetObjectCommand)
            .resolves(lexStatusFromS3)
            .on(PutObjectCommand)
            .resolves({});
        lexClientMock.on(GetBotCommand).resolves(lexStatusFromLex);
        lambdaClientMock.on(InvokeCommand).resolves({});

        await handler(event, context, callback);

        expect(s3ClientMock).toHaveReceivedNthCommandWith(1, GetObjectCommand, {
            Bucket: 'test-bucket',
            Key: 'test-key',
        });
        expect(s3ClientMock).toHaveReceivedNthCommandWith(2, PutObjectCommand, {
            Bucket: 'test-bucket',
            Key: 'test-key',
            Body: JSON.stringify({
                status: 'BUILDING',
            }),
        });
        expect(lexClientMock).toHaveReceivedCommandWith(GetBotCommand, {
            name: process.env.BOT_NAME,
            versionOrAlias: '$LATEST',
        });
        expect(lambdaClientMock).toHaveReceivedCommandWith(InvokeCommand, {

        });
    });

    it('it only invokes lambda if lex in BUILDING state', async () => {
        const lexStatusFromS3 = {
            Body: fs.createReadStream('./master/lex-build/__tests__/test.json'),
        };
        const lexStatusFromLex = {
            status: 'NOT BUILDING',
        };

        process.env.STATUS_BUCKET = 'test-bucket';
        process.env.STATUS_KEY = 'test-key';
        process.env.BOT_NAME = 'test-bot';
        process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-lambda';

        jest
            .spyOn(global, 'setTimeout')
            .mockImplementation(async (cb) => (typeof cb === 'function' ? cb() : null));

        s3ClientMock
            .on(GetObjectCommand)
            .resolves(lexStatusFromS3)
            .on(PutObjectCommand)
            .resolves({});
        lexClientMock.on(GetBotCommand).resolves(lexStatusFromLex);
        lambdaClientMock.on(InvokeCommand).resolves({});

        await handler(event, context, callback);

        expect(s3ClientMock).toHaveReceivedNthCommandWith(1, GetObjectCommand, {
            Bucket: 'test-bucket',
            Key: 'test-key',
        });
        expect(s3ClientMock).toHaveReceivedNthCommandWith(2, PutObjectCommand, {
            Bucket: 'test-bucket',
            Key: 'test-key',
            Body: JSON.stringify({
                status: 'NOT BUILDING',
            }),
        });
        expect(lexClientMock).toHaveReceivedCommandWith(GetBotCommand, {
            name: process.env.BOT_NAME,
            versionOrAlias: '$LATEST',
        });
        expect(lambdaClientMock).not.toHaveReceivedCommand(InvokeCommand);
    });

    it('it handles errors gracefully', async () => {
        const lexStatusFromS3 = {
            Body: fs.createReadStream('./master/lex-build/__tests__/test.json'),
        };
        const lexStatusFromLex = {
            status: 'BUILDING',
        };

        process.env.STATUS_BUCKET = 'test-bucket';
        process.env.STATUS_KEY = 'test-key';
        process.env.BOT_NAME = 'test-bot';
        process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-lambda';

        jest
            .spyOn(global, 'setTimeout')
            .mockImplementation(async (cb) => (typeof cb === 'function' ? cb() : null));

        s3ClientMock
            .on(GetObjectCommand)
            .resolves(lexStatusFromS3)
            .on(PutObjectCommand)
            .resolves({});
        lexClientMock.on(GetBotCommand).resolves(lexStatusFromLex);
        lambdaClientMock.on(InvokeCommand).rejects('mock rejection');

        try {
            await handler(event, context, callback);
        } catch (e) {
            expect(e).toEqual(new Error('mock rejection'));
        }

        expect(s3ClientMock).toHaveReceivedNthCommandWith(1, GetObjectCommand, {
            Bucket: 'test-bucket',
            Key: 'test-key',
        });
        expect(lexClientMock).toHaveReceivedCommandWith(GetBotCommand, {
            name: process.env.BOT_NAME,
            versionOrAlias: '$LATEST',
        });
        expect(lambdaClientMock).toHaveReceivedCommand(InvokeCommand);
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });
});
