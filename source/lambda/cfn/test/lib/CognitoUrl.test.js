/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const originalEnv = process.env;
const cognitoUrl = require('../../lib/CognitoUrl');
const cognitoUrlFixtures = require('./CognitoUrl.fixtures');
const originalRegion = process.env.AWS_REGION;

describe('test CognitoUrl class', () => {
    beforeEach(() => {
        process.env.AWS_REGION = 'us-east-1';
        process.env = {
            ...originalEnv,
        };
    });

    afterEach(() => {
        process.env.AWS_REGION = originalRegion;
        jest.clearAllMocks();
    });

    it("should be able to Create a new cognito url", async () => {
        const cognitoUrlCut = new cognitoUrl();
        const params = cognitoUrlFixtures.cognitoUrlObject();
        
        const callback = (error, result, secondResult) => {
            expect(result).toBe('mock_domain');
            expect(secondResult.Domain).toBe('https://mock_domain.auth.us-east-1.amazoncognito.com');
        };

        await cognitoUrlCut.Create(params, callback);
    });  

    it("should call Create when Update is called", async () => {
        const cognitoUrlCut = new cognitoUrl();
        const params = cognitoUrlFixtures.cognitoUrlObject();
        const createSpy = jest.spyOn(cognitoUrl.prototype, 'Create');

        const callback = (error, result) => {};

        await cognitoUrlCut.Update('mock_id', params, {}, callback);

        expect(createSpy).toHaveBeenCalledTimes(1); 
    });  
});