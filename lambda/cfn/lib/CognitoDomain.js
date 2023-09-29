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

module.exports = class CognitoDomain extends require('./base') {
    constructor() {
        super();
    }

    Create(params, reply) {
        const domain = generate(12);

        cognito.createUserPoolDomain({
            Domain: domain,
            UserPoolId: params.UserPool,
        }).promise()
            .then(() => reply(null, domain, {}))
            .catch(reply);
    }

    Update(ID, params, oldparams, reply) {
        this.Create(params, reply);
    }

    Delete(ID, params, reply) {
        cognito.deleteUserPoolDomain({
            Domain: ID,
            UserPoolId: params.UserPool,
        }).promise()
            .then(() => reply(null, ID))
            .catch(reply);
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
    const number = Math.floor(Math.random() * (max - min + 1)) + min;
    return (`${number}`).substring(add);
}
