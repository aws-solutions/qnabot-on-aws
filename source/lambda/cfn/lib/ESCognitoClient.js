/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const {  CognitoIdentityProviderClient, ListUserPoolClientsCommand, DescribeUserPoolClientCommand } = require('@aws-sdk/client-cognito-identity-provider');
const customSdkConfig = require('./util/customSdkConfig');

const region = process.env.AWS_REGION || 'us-east-1';
const cognito = new CognitoIdentityProviderClient(customSdkConfig({ region }));

module.exports = class ESCognitoClient extends require('./base') {
    constructor() {
        super();
    }

    async Create(params, reply) {
        await run(params, reply);
    }

    async Update(Id, params, oldparams, reply) {
        await run(params, reply);
    }
};

async function run(params, reply) {
    try {
        const userpool = params.UserPool;

        const clients = await cognito.send(new ListUserPoolClientsCommand({
            UserPoolId: userpool,
            MaxResults: 10,
        }));
        console.log(clients);

        const myReg = new RegExp(params.DomainName);

        const client = clients.UserPoolClients
            .filter((x) => x.ClientName.match(myReg))
            [0].ClientId;

        console.log(client);
        const info = await cognito.send(new DescribeUserPoolClientCommand({
            ClientId: client,
            UserPoolId: userpool,
        }));

        console.log(info);
        reply(null, client, info.UserPoolClient);
    } catch (e) {
        console.log(e);
        reply(e);
    }
}
