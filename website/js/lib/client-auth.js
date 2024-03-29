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

module.exports = async function() {
    const result = await axios.head(window.location.href);
    const stage = result.headers['api-stage'];
    const response = await axios.get(`/${stage}`);
    const info = response.data;
    const region = info.region;
    const lex = new LexRuntimeService({ region })
    const polly = new Polly({ region });
    aws.config.region = region;
    let credentials, username, token;
    const { code } = query.parse(window.location.search);
    if (code) {
        if (window.sessionStorage.getItem('refresh_token')) {
            token = await refreshTokens(response);
        } 
        if (!token) {
            token = await getTokens(response, code);
        }
        const decodedToken = jwt.decode(token);
        const Logins = {};
        Logins[[
            'cognito-idp.',
            info.region,
            '.amazonaws.com/',
            info.UserPool,
        ].join('')] = token;

        credentials = new aws.CognitoIdentityCredentials({
            IdentityPoolId: info.PoolId,
            RoleSessionName: decodedToken['cognito:username'],
            Logins,
        });
        username = decodedToken['cognito:username'];
    } else {
        credentials = new aws.CognitoIdentityCredentials({
            IdentityPoolId: info.PoolId,
        });
    }
    credentials.clearCachedId();
    await credentials.getPromise();
    return {
        config: {
            region,
            credentials
        },
        lex,
        polly,
        username,
        Login: _.get(info, '_links.ClientLogin.href'),
        idtoken: token,
    };
};

async function getTokens(response, code) {
    const endpoint = response.data._links.CognitoEndpoint.href;
    const clientId = response.data.ClientIdClient;
    try {
        const axiosData = query.stringify({
            grant_type: 'authorization_code',
            client_id: clientId,
            code,
            redirect_uri: window.location.origin + window.location.pathname,
        });
        const tokens = await axiosPost('POST', endpoint, axiosData);
        
        window.sessionStorage.setItem('refresh_token', tokens.data.refresh_token);
        return tokens.data.id_token;
    } catch (e) {
        console.log(e);
        const result = window.confirm('Unable to fetch credentials, please log back in. Click Ok to be redirected to the login page.');
        if (result) {
            window.location.href = response.data._links.ClientLogin.href;
        }
    }
}


async function refreshTokens(response) {
    const refresh_token = window.sessionStorage.getItem('refresh_token');
    const endpoint = response.data._links.CognitoEndpoint.href;
    const clientId = response.data.ClientIdClient;
    try {
        const axiosData = query.stringify({
            grant_type: 'refresh_token',
            client_id: clientId,
            refresh_token,
        });
        const tokens = await axiosPost( 'POST', endpoint, axiosData); 

        return tokens.data.id_token;
    } catch (e) {
        console.log(e);
    }
}

async function axiosPost(axiosMethod, axiosClient, axiosData) {
    const tokens = await axios({
        method: axiosMethod,
        url: `${axiosClient}/oauth2/token`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: axiosData,
    });
    return tokens;
}
