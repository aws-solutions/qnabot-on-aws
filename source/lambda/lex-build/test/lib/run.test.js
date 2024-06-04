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

const run = require('../../lib/run');
const { LexModelBuildingServiceClient,
    CreateBotVersionCommand
} = require('@aws-sdk/client-lex-model-building-service');
const { mockClient } = require('aws-sdk-client-mock');
const lexModelBuildingServiceClientMock = mockClient(LexModelBuildingServiceClient);


describe('When calling run function', () => {
    const lexCreateBotResponse = {
        "$metadata": {
            "httpStatusCode": 201, "requestId": "429fe1b2-c69f-4a41-aa14-146a85677fb3", "attempts": 1,
            "totalRetryDelay": 0
        },
        "locale": "en-US", "name": "test_bot", "status": "BUILDING", "version": "1"
    };

    beforeEach(() => {
        lexModelBuildingServiceClientMock.reset();
    });

    test('should successfully invoke function passed in parameter and return response', async () => {
        lexModelBuildingServiceClientMock.on(CreateBotVersionCommand).resolves(lexCreateBotResponse);
        const response = await run('createBotVersion', { "name": "test_bot", "checksum": "test_checksum" });
        expect(response).toEqual(lexCreateBotResponse);

    });

    test('when lex service returns ConflictException and retry is successful, it should return response', async () => {
        lexModelBuildingServiceClientMock.on(CreateBotVersionCommand).callsFakeOnce(() => {
            const error = new Error("ConflictException");
            error.name = "ConflictException";
            throw error;
        }).resolvesOnce(lexCreateBotResponse);
        const response = await run('createBotVersion', { "name": "test_bot", "checksum": "test_checksum" });
        expect(response).toEqual(lexCreateBotResponse);
    }, 10000);

    test('when lex service returns ResourceInUseException with retryAfterSeconds value set and retry is successful, it should return response', async () => {
        lexModelBuildingServiceClientMock.on(CreateBotVersionCommand).callsFakeOnce(() => {
            const error = new Error("ResourceInUseException");
            error.name = "ResourceInUseException";
            error.retryAfterSeconds = 3;
            throw error;
        }).resolvesOnce(lexCreateBotResponse);
        const response = await run('createBotVersion', { "name": "test_bot", "checksum": "test_checksum" });
        expect(response).toEqual(lexCreateBotResponse);
    }, 10000);

    test('when lex service returns ResourceInUseException and retry is successful, it should return response', async () => {
        lexModelBuildingServiceClientMock.on(CreateBotVersionCommand).callsFakeOnce(() => {
            const error = new Error("ResourceInUseException");
            error.name = "ResourceInUseException";
            throw error;
        }).resolvesOnce(lexCreateBotResponse);
        const response = await run('createBotVersion', { "name": "test_bot", "checksum": "test_checksum" });
        expect(response).toEqual(lexCreateBotResponse);
    }, 10000);

    test('when lex service returns LimitExceededException and retry is successful, it should return response', async () => {
        lexModelBuildingServiceClientMock.on(CreateBotVersionCommand).callsFakeOnce(() => {
            const error = new Error("LimitExceededException");
            error.name = "LimitExceededException";
            throw error;
        }).resolvesOnce(lexCreateBotResponse);
        const response = await run('createBotVersion', { "name": "test_bot", "checksum": "test_checksum" });
        expect(response).toEqual(lexCreateBotResponse);
    }, 10000);

    test('should throw error when the error from lex service is not in retry error list', async () => {
        lexModelBuildingServiceClientMock.on(CreateBotVersionCommand).callsFakeOnce(() => {
            const error = new Error("Test Error");
            error.name = "TestError";
            throw error;
        });
        await expect(run('createBotVersion', { "name": "test_bot", "checksum": "test_checksum" })).rejects.toThrow('TestError:Test Error');
    });
}
);