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
const {
    CognitoIdentityProviderClient,
    UpdateUserPoolClientCommand,
    SetUICustomizationCommand
} = require('@aws-sdk/client-cognito-identity-provider');
const originalEnv = process.env;
const cognitoLogin = require('../../lib/CognitoLogin');
const cognitoLoginFixtures = require('./CognitoLogin.fixtures');
const cognitoIdentityProviderMock = mockClient(CognitoIdentityProviderClient);
const s3ClientMock = mockClient(S3Client);
require('aws-sdk-client-mock-jest');
describe('test CognitoLogin class', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv
        };

        cognitoIdentityProviderMock.reset();
        s3ClientMock.reset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be able to create a new user pool domain with no S3 on Create', async () => {
        const cognitoLoginCut = new cognitoLogin();
        const params = cognitoLoginFixtures.userPoolClientParamsObject();
        cognitoIdentityProviderMock.on(UpdateUserPoolClientCommand).resolves({});
        cognitoIdentityProviderMock.on(SetUICustomizationCommand).resolves({});

        const callback = (error, result) => {
            expect(result).toBe('mock_callback_url');
        };

        await cognitoLoginCut.Create(params, callback);
        expect(cognitoIdentityProviderMock).toHaveReceivedCommandTimes(UpdateUserPoolClientCommand, 1);
        expect(cognitoIdentityProviderMock).toHaveReceivedCommandWith(UpdateUserPoolClientCommand, {
            'AllowedOAuthFlows': ['code'],
            'AllowedOAuthFlowsUserPoolClient': true,
            'AllowedOAuthScopes': ['phone', 'email', 'openid', 'profile'],
            'CallbackURLs': ['mock_login_url'],
            'ClientId': 'mock_client_id',
            'ExplicitAuthFlows': ['ADMIN_NO_SRP_AUTH'],
            'LogoutURLs': ['mock_logout_callback_url'],
            'RefreshTokenValidity': 1,
            'SupportedIdentityProviders': ['COGNITO'],
            'TokenValidityUnits': { 'RefreshToken': 'days' },
            'UserPoolId': 'mock_user_pool'
        });
        expect(cognitoIdentityProviderMock).toHaveReceivedCommandTimes(SetUICustomizationCommand, 1);
        expect(s3ClientMock).toHaveReceivedCommandTimes(GetObjectCommand, 0)
        expect(cognitoIdentityProviderMock).toHaveReceivedCommandWith(SetUICustomizationCommand, {
            'ClientId': 'mock_client_id',
            'UserPoolId': 'mock_user_pool',
            'CSS': 'mock_css'
        });
    });

    it('should be able to create a new user pool domain with S3 on Create', async () => {
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
        expect(cognitoIdentityProviderMock).toHaveReceivedCommandTimes(UpdateUserPoolClientCommand, 1);
        expect(cognitoIdentityProviderMock).toHaveReceivedCommandWith(UpdateUserPoolClientCommand, {
            'AllowedOAuthFlows': ['code'],
            'AllowedOAuthFlowsUserPoolClient': true,
            'AllowedOAuthScopes': ['phone', 'email', 'openid', 'profile'],
            'CallbackURLs': ['mock_login_url'],
            'ClientId': 'mock_client_id',
            'ExplicitAuthFlows': ['ADMIN_NO_SRP_AUTH'],
            'LogoutURLs': ['mock_logout_callback_url'],
            'RefreshTokenValidity': 1,
            'SupportedIdentityProviders': ['COGNITO'],
            'TokenValidityUnits': { 'RefreshToken': 'days' },
            'UserPoolId': 'mock_user_pool'
        });
        expect(cognitoIdentityProviderMock).toHaveReceivedCommandTimes(SetUICustomizationCommand, 1);
        expect(s3ClientMock).toHaveReceivedCommandTimes(GetObjectCommand, 1)
        expect(s3ClientMock).toHaveReceivedCommandWith(GetObjectCommand, {
            'Bucket': 'mock_image_bucket',
            'Key': 'mock_image_key'
        });
        expect(cognitoIdentityProviderMock).toHaveReceivedCommandWith(SetUICustomizationCommand, {
            'ClientId': 'mock_client_id',
            'UserPoolId': 'mock_user_pool',
            'CSS': 'mock_css'
        });
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