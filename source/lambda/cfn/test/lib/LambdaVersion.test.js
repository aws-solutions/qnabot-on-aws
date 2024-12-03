/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { mockClient } = require('aws-sdk-client-mock');
const { LambdaClient, PublishVersionCommand } = require('@aws-sdk/client-lambda');
const originalEnv = process.env;
const lambdaVersion = require('../../lib/LambdaVersion');
const lambdaVersionFixtures = require('./LambdaVersion.fixtures');
const lambdaClientMock = mockClient(LambdaClient);

describe('test LambdaVersion class', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
        };

        lambdaClientMock.reset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be able to publish new Lambda version on Create", async () => {
        const lambdaVersionCut = new lambdaVersion();
        const publishVersionCommandObject = lambdaVersionFixtures.publishVersionCommandObject();
        const params = lambdaVersionFixtures.lambdaVersionParamsObject();
        
        const callback = (error, result) => {
            expect(result).toBe('1');
        };

        lambdaClientMock.on(PublishVersionCommand).resolves(publishVersionCommandObject);

        await lambdaVersionCut.Create(params, callback);
    });  

    it("should return error if exception occurred on Create", async () => {
        const lambdaVersionCut = new lambdaVersion();
        const params = lambdaVersionFixtures.lambdaVersionParamsObject();

        const callback = (error, result) => {
            expect(error.message).toBe('mocked lambda error');
        };

        lambdaClientMock.on(PublishVersionCommand).rejects('mocked lambda error');
        
        await lambdaVersionCut.Create(params, callback);
    });  

    it("should be able to publish new Lambda version on Update", async () => {
        const lambdaVersionCut = new lambdaVersion();
        const publishVersionCommandObject = lambdaVersionFixtures.publishVersionCommandObject();
        const params = lambdaVersionFixtures.lambdaVersionParamsObject();        

        const callback = (error, result) => {
            expect(result).toBe('1');
        };

        lambdaClientMock.on(PublishVersionCommand).resolves(publishVersionCommandObject);

        await lambdaVersionCut.Update('mock_user_id', params, {}, callback);
    });
});