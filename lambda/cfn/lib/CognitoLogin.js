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

const Promise = require('./util/promise');
const aws = require('./util/aws');

const cognito = new aws.CognitoIdentityServiceProvider();
const crypto = Promise.promisifyAll(require('crypto'));

module.exports = class CognitoLogin extends require('./base') {
    constructor() {
        super();
    }

    Create(params, reply) {
        const url = params.CallbackUrl;

        return cognito.updateUserPoolClient({
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
        }).promise()
            .then(() => {
                if (params.ImageBucket && params.ImageKey) {
                    return (new aws.S3()).getObject({
                        Bucket: params.ImageBucket,
                        Key: params.ImageKey,
                    }).promise().get('content')
                        .then((x) => params.Image = x);
                }
            })
            .then(() => cognito.setUICustomization({
                ClientId: params.ClientId,
                UserPoolId: params.UserPool,
                CSS: params.CSS,
            }))
            .then(() => reply(null, url))
            .catch(reply);
    }
};
