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