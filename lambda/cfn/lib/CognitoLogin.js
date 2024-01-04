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

const { CognitoIdentityProvider } = require('@aws-sdk/client-cognito-identity-provider');
const { S3 } = require('@aws-sdk/client-s3');
const customSdkConfig = require('./util/customSdkConfig');

const region = process.env.AWS_REGION || 'us-east-1';
const cognito = new CognitoIdentityProvider(customSdkConfig({ region }));
const s3 = new S3(customSdkConfig({ region }));

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
                SupportedIdentityProviders: ['COGNITO'],
                AllowedOAuthFlows: ['code', 'implicit'],
                AllowedOAuthScopes: ['phone', 'email', 'openid', 'profile'],
                AllowedOAuthFlowsUserPoolClient: true,
            }
            await cognito.updateUserPoolClient(userParams);

            if (params.ImageBucket && params.ImageKey) {
                const result = await s3.getObject({
                    Bucket: params.ImageBucket,
                    Key: params.ImageKey,
                });
                params.Image = await result.Body.transformToByteArray();
            }
            await cognito.setUICustomization({
                ClientId: params.ClientId,
                UserPoolId: params.UserPool,
                CSS: params.CSS,
            });
            reply(null, url);
        } catch (e) {
            console.error('An error occured in CognitoLogin: ', e);
            reply(e);
        }
    }
};
