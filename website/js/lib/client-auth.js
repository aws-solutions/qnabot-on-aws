/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

const aws = require('aws-sdk');
const axios = require('axios');
const _ = require('lodash');
const query = require('query-string');
const jwt = require('jsonwebtoken');
const { LexRuntimeService } = require('@aws-sdk/client-lex-runtime-service');
const { Polly } = require('@aws-sdk/client-polly');

module.exports = async function () {
    const result = await axios.head(window.location.href);
    const stage = result.headers['api-stage'];
    const response = await axios.get(`/${stage}`);
    const info = response.data;
    const hash = window.location.hash.slice(1);
    const params = query.parse(hash);
    const region = info.region;
    const lex = new LexRuntimeService({ region })
    const polly = new Polly({ region });
    aws.config.region = region;
    let credentials, username;
    if (params.id_token) {
        const token = jwt.decode(params.id_token);
        console.log(token);
        const Logins = {};
        Logins[[
            'cognito-idp.',
            info.region,
            '.amazonaws.com/',
            info.UserPool,
        ].join('')] = params.id_token;

        credentials = new aws.CognitoIdentityCredentials({
            IdentityPoolId: info.PoolId,
            RoleSessionName: token['cognito:username'],
            Logins,
        });
        username = token['cognito:username'];
    } else {
        credentials = new aws.CognitoIdentityCredentials({
            IdentityPoolId: info.PoolId,
        });
    }
    credentials.clearCachedId();
    await credentials.getPromise();
    return {
        config: { region, credentials},
        lex,
        polly,
        username,
        Login: _.get(info, '_links.ClientLogin.href'),
        idtoken: params.id_token,
    };
};
