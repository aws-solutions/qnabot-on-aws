/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { CognitoIdentityProviderClient, CreateUserPoolDomainCommand, DeleteUserPoolDomainCommand } = require('@aws-sdk/client-cognito-identity-provider');
const customSdkConfig = require('./util/customSdkConfig');

const region = process.env.AWS_REGION || 'us-east-1';
const cognito = new CognitoIdentityProviderClient(customSdkConfig({ region }));

module.exports = class CognitoDomain extends require('./base') {
    constructor() {
        super();
    }

    async Create(params, reply) {
        const domain = generate(12);
        try {
            await cognito.send(new CreateUserPoolDomainCommand({
                Domain: domain,
                UserPoolId: params.UserPool,
            }));
            reply(null, domain, {});
        } catch (e) {
            reply(e);
        }
    }

    async Update(ID, params, oldparams, reply) {
        await this.Create(params, reply);
    }

    async Delete(ID, params, reply) {
        try {
            await cognito.send(new DeleteUserPoolDomainCommand({
                Domain: ID,
                UserPoolId: params.UserPool,
            }));
            reply(null, ID);
        } catch (e) {
            reply(e);
        }
    }
};

function generate(n) {
    const add = 1; let
        max = 12 - add;
    if (n > max) {
        return generate(max) + generate(n - max);
    }
    max = 10 ** (n + add);
    const min = max / 10; // Math.pow(10, n) basically
    const number = Math.floor(Math.random() * (max - min + 1)) + min;  // NOSONAR It is safe to use random generator here
    return (`${number}`).substring(add);
}
