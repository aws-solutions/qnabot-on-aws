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

const aws = require('aws-sdk');
const axios = require('axios');
const _ = require('lodash');
const query = require('query-string');
const jwt = require('jsonwebtoken');

module.exports = function () {
    return Promise.resolve(axios.head(window.location.href))
        .then((result) => {
            const stage = result.headers['api-stage'];
            return Promise.resolve(axios.get(`/${stage}`)).then((x) => x.data);
        })
        .then((info) => {
            const hash = window.location.hash.slice(1);
            const params = query.parse(hash);
            aws.config.region = info.region;
            let credentials; let
                username;
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
            return Promise.resolve(credentials.getPromise()).then((x) => ({
                credentials,
                username,
                Login: _.get(info, '_links.ClientLogin.href'),
                id_token: params.id_token,
            }));
        })
        .then((result) => {
            aws.config.credentials = result.credentials;
            return {
                config: aws.config,
                lex: new aws.LexRuntime(),
                polly: new aws.Polly(),
                username: result.username,
                Login: result.Login,
                idtoken: result.id_token,
            };
        });
};
