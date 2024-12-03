/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { fromCognitoIdentityPool } = require('@aws-sdk/credential-providers');
const { CognitoIdentityClient, GetIdCommand, GetCredentialsForIdentityCommand } = require('@aws-sdk/client-cognito-identity');
const { LexRuntimeServiceClient } = require('@aws-sdk/client-lex-runtime-service');
const { LexRuntimeV2Client } = require('@aws-sdk/client-lex-runtime-v2');
const { PollyClient } = require('@aws-sdk/client-polly');
const axios = require('axios');
const _ = require('lodash');
const query = require('query-string');
const jwt = require('jsonwebtoken');

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
        const tokens = await axiosPost('POST', endpoint, axiosData);
        return tokens.data.id_token;
    } catch (e) {
        console.log(e);
    }
}

async function getIdentityId(region, identityPoolId, Logins) {
    const client = new CognitoIdentityClient({ region });
    const input = {
        IdentityPoolId: identityPoolId,
        Logins,
    };
    const command = new GetIdCommand(input);
    try {
        const res = await client.send(command);
        return res.IdentityId;
    } catch (error) {
        console.log('Error while retrieving Identity Id:', error);
    }
}

async function getAuthCredentials(region, identityId, Logins) {
    const client = new CognitoIdentityClient({ region });
    const input = {
        IdentityId: identityId,
        Logins,
    };
    const command = new GetCredentialsForIdentityCommand(input);
    try {
        const res = await client.send(command);
        const creds = res.Credentials;
        const credentials = {
            accessKeyId: creds.AccessKeyId,
            identityId,
            secretAccessKey: creds.SecretKey,
            sessionToken: creds.SessionToken,
            expiration: creds.Expiration,
        };
        return credentials;
    } catch (error) {
        console.log('Error while retrieving Auth Credentials:', error);
    }
}

async function getCredentials(region, poolId, login = {}) {
    const credentialProvider = fromCognitoIdentityPool({
        identityPoolId: poolId,
        logins: login,
        clientConfig: { region },
    });
    const credentials = credentialProvider();
    return credentials;
}

module.exports = async function () {
    const result = await axios.head(window.location.href);
    const stage = result.headers['api-stage'];
    const response = await axios.get(`/${stage}`);
    const info = response.data;
    const { region } = info;
    let credentials, username, token, identityId, polly, lexV1, lexV2;
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
        identityId = await getIdentityId(region, info.PoolId, Logins);
        credentials = await getAuthCredentials(region, identityId, Logins);
        const awsConfig = {
            region,
            credentials,
        };
        polly = new PollyClient(awsConfig);
        lexV1 = new LexRuntimeServiceClient(awsConfig);
        lexV2 = new LexRuntimeV2Client(awsConfig);
        username = decodedToken['cognito:username'];
    } else {
        credentials = await getCredentials(region, info.PoolId);
        const awsConfig = {
            region,
            credentials,
        };
        polly = new PollyClient(awsConfig);
        lexV1 = new LexRuntimeServiceClient(awsConfig);
        lexV2 = new LexRuntimeV2Client(awsConfig);
    }
    return {
        config: {
            region,
            credentials,
        },
        lexV1,
        lexV2,
        polly,
        username,
        Login: _.get(info, '_links.ClientLogin.href'),
        idtoken: token,
    };
};
