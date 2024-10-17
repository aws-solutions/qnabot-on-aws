/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { CognitoIdentityProviderClient, UpdateUserPoolClientCommand, SetUICustomizationCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('./util/customSdkConfig');

const region = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client(customSdkConfig({ region }));
const cognitoClient = new CognitoIdentityProviderClient(customSdkConfig({ region }));
module.exports = class CognitoLogin extends require('./base') {
    constructor() {
        super();
    }

    async Create(params, reply) {
        const url = params.CallbackUrl;
        try {
            const userParams = {
                ClientId: params.ClientId,
                UserPoolId: params.UserPool,
                CallbackURLs: params.LoginCallbackUrls,
                LogoutURLs: params.LogoutCallbackUrls,
                ExplicitAuthFlows: ['ADMIN_NO_SRP_AUTH'],
                RefreshTokenValidity: 1,
                TokenValidityUnits: { RefreshToken: 'days' },
                SupportedIdentityProviders: ['COGNITO'],
                AllowedOAuthFlows: ['code'],
                AllowedOAuthScopes: ['phone', 'email', 'openid', 'profile'],
                AllowedOAuthFlowsUserPoolClient: true,
            }
            console.log(`Cognito User Params: ${JSON.stringify(userParams, null, 2)}`);

            const updateUserPoolClientCmd = new UpdateUserPoolClientCommand(userParams);
            await cognitoClient.send(updateUserPoolClientCmd);

            if (params.ImageBucket && params.ImageKey) {
                const s3Params = { 
                    Bucket: params.ImageBucket, 
                    Key: params.ImageKey 
                };
                const getObjCmd = new GetObjectCommand(s3Params);
                const result = await s3Client.send(getObjCmd);
                params.Image = await result.Body.transformToByteArray();
            }

            const uiParams = {
                ClientId: params.ClientId,
                UserPoolId: params.UserPool,
                CSS: params.CSS,
            }
            const uiCustomizationCmd = new SetUICustomizationCommand(uiParams);
            await cognitoClient.send(uiCustomizationCmd);

            reply(null, url);
        } catch (e) {
            console.error('An error occured in CognitoLogin: ', e);
            reply(e);
        }
    }

    async Update(ID, params, oldparams, reply) {
        await this.Create(params, reply);
    }
};
