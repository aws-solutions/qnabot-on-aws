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
const wait = require('../../lib/wait');
require('aws-sdk-client-mock-jest');

describe('When calling wait function', () => {
    beforeEach(() => {
        lambdaMock.reset();
        process.env.POLL_LAMBDA = 'test-wait';
    });

    test('Should return successful response', async () => {
        const testResponse = {
            'name': 'test-wait-response',
            'question': 'what is QnABot'
        };

        lambdaMock.on(InvokeCommand).resolves(testResponse);

        const response = await wait('Success');

        expect(lambdaMock).toHaveReceivedCommandTimes(InvokeCommand, 1);
        expect(lambdaMock).toHaveReceivedCommandWith(InvokeCommand, {"FunctionName": "test-wait", "InvocationType": "Event", "Payload": "{}"});
        expect(response).toMatchObject(testResponse);
    });

    test('Should return error', async () => {

        const error = new Error('wait error');
        lambdaMock.on(InvokeCommand).rejects(error);

        await expect(wait('Fail')).rejects.toThrowError(error);

        expect(lambdaMock).toHaveReceivedCommandTimes(InvokeCommand, 1);
        expect(lambdaMock).toHaveReceivedCommandWith(InvokeCommand, {"FunctionName": "test-wait", "InvocationType": "Event", "Payload": "{}"});
    });
});
