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

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { mockClient } = require('aws-sdk-client-mock');
const lambdaMock = mockClient(LambdaClient);
const lexV2 = require('../../lib/lexv2bot');
const status = require('../../lib/statusv2');
require('aws-sdk-client-mock-jest');
jest.mock('../../lib/statusv2');

describe('When calling lexV2bot function', () => {
    beforeEach(() => {
        lambdaMock.reset();
        jest.clearAllMocks();
        process.env.LEXV2_BUILD_LAMBDA = 'testLambda';
        process.env.STATUS_BUCKET = 'testBucket';
        process.env.LEXV2_STATUS_KEY = 'testKey';
    });

    test('Should return result with no error', async () => {
        const qidsandquestions = [
            'What is QnAbot', 'What is temperature in Seattle'
        ];

        const testResult = {
            'name': 'test-result',
            'FunctionName': 'test-function',
            'items': qidsandquestions
        };
        lambdaMock.on(InvokeCommand).resolves(testResult);

        const result = await lexV2(qidsandquestions);

        const params = {
            FunctionName: "testLambda",
            InvocationType: "RequestResponse",
            Payload: "{\"statusFile\":{\"Bucket\":\"testBucket\",\"Key\":\"testKey\"},\"items\":[\"What is QnAbot\",\"What is temperature in Seattle\"]}"
        };
        expect(lambdaMock).toHaveReceivedCommandTimes(InvokeCommand, 1);
        expect(lambdaMock).toHaveReceivedCommandWith(InvokeCommand, params);
        expect(result).toMatchObject(testResult);
        expect(status).toHaveBeenCalledTimes(1);
        expect(status).toHaveBeenCalledWith('Starting LexV2 bot function');
    });

    test('Should throw result with error', async () => {
        const qidsandquestions = [
            'What is QnAbot', 'What is temperature in Seattle'
        ];

        const testResult = {
            'FunctionError': 'Error getting valid test result'
        };
        lambdaMock.on(InvokeCommand).resolves(testResult);

        await expect(async () => {
            await lexV2(qidsandquestions);
        }).rejects.toBe(testResult);

        const params = {
            FunctionName: "testLambda",
            InvocationType: "RequestResponse",
            Payload: "{\"statusFile\":{\"Bucket\":\"testBucket\",\"Key\":\"testKey\"},\"items\":[\"What is QnAbot\",\"What is temperature in Seattle\"]}"
        };
        expect(lambdaMock).toHaveReceivedCommandTimes(InvokeCommand, 1);
        expect(lambdaMock).toHaveReceivedCommandWith(InvokeCommand, params);
        expect(status).toHaveBeenCalledTimes(1);
        expect(status).toHaveBeenCalledWith('Starting LexV2 bot function');
    });
});
