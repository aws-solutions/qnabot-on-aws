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

module.exports = class CognitoUrl extends require('./base') {
    constructor() {
        super();
    }

    Update(ID, params, oldparams, reply) {
        this.Create(params, reply);
    }

    Create(params, reply) {
        const Domain = `https://${params.Domain}.auth.${process.env.AWS_REGION}.amazoncognito.com`;
        const loginUrl = `${Domain}/login?redirect_uri=${encodeURIComponent(params.LoginRedirectUrl)}&response_type=${params.response_type}&client_id=${params.ClientId}`;

        reply(null, params.Domain, {
            Domain,
            loginUrl,
            logoutUrl: `${Domain}/logout?redirect_uri=${encodeURIComponent(loginUrl)}&response_type=token&client_id=${params.ClientId}`,
        });
    }
};
