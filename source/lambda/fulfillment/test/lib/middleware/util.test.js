/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const util = require('../../../lib/middleware/util');
const awsMock = require('aws-sdk-client-mock');
const utilFixtures = require('./util.fixtures')
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const lambdaMock = awsMock.mockClient(LambdaClient);
const originalEnv = process.env;

describe('when calling getLambdaArn function', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return the arn of the lambda function', async () => {
        expect(await util.getLambdaArn('QNA:test')).toBe('QNA:test');

        process.env = {
            ...originalEnv,
            'test': 'mock_lambda_arn'
        };
        expect(await util.getLambdaArn('QNA:test')).toBe('mock_lambda_arn');

        expect(await util.getLambdaArn('mock_lambda')).toBe('mock_lambda');

    });
});

describe('when calling isSameAccountArn function', () => {
    const ACCOUNT_ID = '111122223333';
    const originalAccountId = process.env.AWS_ACCOUNT_ID;

    beforeEach(() => {
        process.env.AWS_ACCOUNT_ID = ACCOUNT_ID;
    });

    afterEach(() => {
        if (originalAccountId === undefined) {
            delete process.env.AWS_ACCOUNT_ID;
        } else {
            process.env.AWS_ACCOUNT_ID = originalAccountId;
        }
        jest.clearAllMocks();
    });

    test('should return true for bare function name (no arn: prefix)', () => {
        expect(util.isSameAccountArn('my-function')).toBe(true);
    });

    test('should return true for function name without arn prefix', () => {
        expect(util.isSameAccountArn('qnabot-fulfillment')).toBe(true);
    });

    test('should return true for same-account full ARN', () => {
        const arn = `arn:aws:lambda:us-east-1:${ACCOUNT_ID}:function:my-function`;
        expect(util.isSameAccountArn(arn)).toBe(true);
    });

    test('should return false for cross-account full ARN', () => {
        const arn = 'arn:aws:lambda:us-east-1:444455556666:function:evil-function';
        expect(util.isSameAccountArn(arn)).toBe(false);
    });

    test('should return false for ARN with different region and account ID', () => {
        const arn = 'arn:aws:lambda:us-west-2:999988887777:function:attacker';
        expect(util.isSameAccountArn(arn)).toBe(false);
    });

    test('should return falsy for malformed ARN with missing account ID', () => {
        const arn = 'arn:aws:lambda:us-east-1::function:no-account';
        expect(util.isSameAccountArn(arn)).toBeFalsy();
    });
});

describe('when calling invokeLambda function', () => {
    beforeEach(() => {
        lambdaMock.reset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should invoke the lambda function', async () => {
        lambdaMock.on(InvokeCommand).resolves(utilFixtures.mockLambdaResponse);

        const response = await util.invokeLambda(utilFixtures.mockLambdaParams);
        expect(response).toEqual({ "response": "mock_response" });

    });

    test('should throw an error if failed to parse Lambda response', async () => {
        lambdaMock.on(InvokeCommand).resolves(utilFixtures.mockLambdaResponseInvalid);

        await expect(
            util.invokeLambda(utilFixtures.mockLambdaParams)
        ).rejects.toThrowError();
    });

    test('should throw an error if Lambda response contains error', async () => {
        lambdaMock.on(InvokeCommand).resolves(utilFixtures.mockLambdaResponseError);
        let thrownError;
        try {
            await util.invokeLambda(utilFixtures.mockLambdaParamsLex);
        } catch (error) {
            thrownError = error;
        }
        expect(thrownError).toEqual(utilFixtures.LexError);

        try {
            await util.invokeLambda(utilFixtures.mockLambdaParamsAlexa);
        } catch (error) {
            console.log(JSON.stringify(error, null, 2))
            thrownError = error;
        }
        expect(thrownError).toEqual(utilFixtures.AlexaError);
    });
});