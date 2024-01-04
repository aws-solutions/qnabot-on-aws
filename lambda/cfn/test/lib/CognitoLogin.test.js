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

const { mockClient } = require('aws-sdk-client-mock');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Readable } = require('stream');
const { sdkStreamMixin } = require('@smithy/util-stream');
const { CognitoIdentityProvider, UpdateUserPoolClientCommand, SetUICustomizationCommand } = require('@aws-sdk/client-cognito-identity-provider');
const originalEnv = process.env;
const cognitoLogin = require("../../lib/CognitoLogin");
const cognitoLoginFixtures = require('./CognitoLogin.fixtures');
const cognitoIdentityProviderMock = mockClient(CognitoIdentityProvider);
const s3ClientMock = mockClient(S3Client);

describe('test CognitoLogin class', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
        };

        cognitoIdentityProviderMock.reset();
    });
    
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be able to create a new user pool domain with no S3 on Create", async () => {
        const cognitoLoginCut = new cognitoLogin();
        const params = cognitoLoginFixtures.userPoolClientParamsObject();
        
        cognitoIdentityProviderMock.on(SetUICustomizationCommand).resolves({});
        
        const callback = (error, result) => {
            expect(result).toBe('mock_callback_url'); 
        };
        
        await cognitoLoginCut.Create(params, callback);
    });  

    it ("should be able to create a new user pool domain with S3 on Create", async() => {
        const cognitoLoginCut = new cognitoLogin();
        const params = cognitoLoginFixtures.userPoolClientWithS3ParamsObject();

        const stream = new Readable();
        stream.push(JSON.stringify(params));
        stream.push(null); // end of stream
        const sdkStream = sdkStreamMixin(stream);
        
        s3ClientMock.on(GetObjectCommand).resolves({ Body: sdkStream });

        cognitoIdentityProviderMock.on(SetUICustomizationCommand).resolves({});

        const callback = (error, result) => {
            expect(result).toBe('mock_callback_url'); 
        };
        
        await cognitoLoginCut.Create(params, callback);
    });

    it("should return error if exception occurred on Create", async () => {
        const cognitoLoginCut = new cognitoLogin();
        const params = cognitoLoginFixtures.userPoolClientParamsObject();
        
        cognitoIdentityProviderMock.on(UpdateUserPoolClientCommand).rejects('mock_error');

        const callback = (error, result) => {
            expect(error.message).toBe('mock_error')
        };

        await cognitoLoginCut.Create(params, callback);
    });  
});