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

const cognito = new aws.CognitoIdentity();

module.exports = class CognitoRole extends require('./base') {
    constructor() {
        super();
    }

    Create(params, reply) {
        const RoleMappings = {};

        params.RoleMappings.map((x) => {
            const id = `cognito-idp.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${x.UserPool}:${x.ClientId}`;
            delete x.ClientId;
            delete x.UserPool;
            RoleMappings[id] = x;
        });

        cognito.getIdentityPoolRoles({
            IdentityPoolId: params.IdentityPoolId,
        }).promise().tap(console.log)
            .then((result) => {
            // result.Roles=Object.assign(result.Roles || {},params.Roles)
            // result.RoleMappings=Object.assign(result.RoleMappings || {},RoleMappings)
            // Overwrite any existing roles and mappings with new ones - existing mappings may no longer be valid after an upgrade.
                result.Roles = params.Roles;
                result.RoleMappings = RoleMappings;
                console.log(result);

                return cognito.setIdentityPoolRoles(result).promise();
            })
            .tap(console.log)
            .then(() => reply(null, 'RoleMapping'))
            .catch(reply);
    }

    Update(ID, params, oldparams, reply) {
        this.Create(params, reply);
    }

    Delete(ID, params, reply) {
        const ids = params.RoleMappings.map((x) => `cognito-idp.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${x.UserPool}:${x.ClientId}`);

        cognito.getIdentityPoolRoles({
            IdentityPoolId: params.IdentityPoolId,
        }).promise().tap(console.log)
            .then((result) => {
                ids.forEach((x) => {
                    delete result.RoleMappings[x];
                });
                console.log(result);
                return cognito.setIdentityPoolRoles(result).promise();
            })
            .tap(console.log)
            .then(() => reply(null, 'RoleMapping'))
            .catch(reply);
    }
};
