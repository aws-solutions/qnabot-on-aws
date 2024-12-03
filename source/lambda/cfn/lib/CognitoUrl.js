/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
            logoutUrl: `${Domain}/logout?redirect_uri=${encodeURIComponent(loginUrl)}&response_type=${params.response_type}&client_id=${params.ClientId}`,
        });
    }
};
