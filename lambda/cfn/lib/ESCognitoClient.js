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

module.exports = class ESCognitoClient extends require('./base') {
    constructor() {
        super();
    }

    async Create(params, reply) {
        run(params, reply);
    }

    async Update(Id, params, oldparams, reply) {
        run(params, reply);
    }
};

async function run(params, reply) {
    try {
        const userpool = params.UserPool;

        const clients = await cognito.listUserPoolClients({
            UserPoolId: userpool,
            MaxResults: 10,
        }).promise();
        console.log(clients);

        const myReg = new RegExp(params.DomainName);

        const client = clients.UserPoolClients
            .filter((x) => x.ClientName.match(myReg))
            [0].ClientId;

        console.log(client);
        const info = await cognito.describeUserPoolClient({
            ClientId: client,
            UserPoolId: userpool,
        }).promise();

        console.log(info);
        reply(null, client, info.UserPoolClient);
    } catch (e) {
        console.log(e);
        reply(e);
    }
}
