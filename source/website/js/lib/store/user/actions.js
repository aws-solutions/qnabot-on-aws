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

const axios = require('axios');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
require('vue');
const query = require('query-string');
const { fromCognitoIdentityPool } = require('@aws-sdk/credential-providers');
const { CognitoIdentityProviderClient, AdminUserGlobalSignOutCommand } = require('@aws-sdk/client-cognito-identity-provider');
const util = require('../../../capability/util');

const provideCredentials = async (context) => {
    const region = context.rootState.info.region;
    const logins = {};
    logins[[
        'cognito-idp.',
        context.rootState.info.region,
        '.amazonaws.com/',
        context.rootState.info.UserPool,
    ].join('')] = context.state.token;

    const credentialProvider = fromCognitoIdentityPool({
        identityPoolId: context.rootState.info.PoolId,
        logins,
        clientConfig: { region },
    })

    const credentials = await credentialProvider();
    context.state.credentials = credentials;
    return context.state.credentials;
};

const getTokens = async (context, code) => {
    const endpoint = context.rootState.info._links.CognitoEndpoint.href;
    const clientId = context.rootState.info.ClientIdDesigner;

    try {
        const tokens = await axios({
            method: 'POST',
            url: `${endpoint}/oauth2/token`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: query.stringify({
                grant_type: 'authorization_code',
                client_id: clientId,
                code,
                redirect_uri: window.location.origin + window.location.pathname,
            }),
        });

        window.sessionStorage.setItem('id_token', tokens.data.id_token);
        window.sessionStorage.setItem('access_token', tokens.data.access_token);
        window.sessionStorage.setItem('refresh_token', tokens.data.refresh_token);
        context.state.token = tokens.data.id_token;

        return tokens.data.id_token;
    } catch (e) {
        const loginUrl = _.get(context, 'rootState.info._links.DesignerLogin.href');
        const result = window.confirm('Unable to fetch credentials, please log back in. Click Ok to be redirected to the login page.');
        if (result) {
            await context.dispatch('logout');
            window.location.href = loginUrl;
        }
    }
};

const login = async (context) => {
        const id_token = window.sessionStorage.getItem('id_token');
        let token;

        if (id_token && id_token !== 'undefined') {
            token = jwt.decode(id_token);
            context.state.token = id_token;
        } else {
            const { code } = query.parse(window.location.search);
            token = jwt.decode(await getTokens(context, code));
        }

        context.state.name = token['cognito:username'];
        context.state.groups = token['cognito:groups'];

        if (!context.state.groups || !context.state.groups.includes('Admins')) {
            const loginUrl = _.get(context.rootState, 'info._links.DesignerLogin.href');
            window.alert('You must be an administrative user to view this page');
            window.location.href = loginUrl;
        }
    };

const logout = async (context) => {
        const redirectUrl = window.location.origin + window.location.pathname;
        const cognitoEndpoint = context.rootState.info._links.CognitoEndpoint.href;
        const username = context.rootState.user.name;
        const clientId = context.rootState.info.ClientIdDesigner;
        const userpool = context.rootState.info.UserPool;
        const region = context.rootState.info.region;

        try {
            const credentials = await provideCredentials(context);
    
            const client = new CognitoIdentityProviderClient({ 
                region, 
                credentials,
                customUserAgent: util.getUserAgentString(context.rootState.info.Version, 'C023'),
            });
    
            const adminSignOutCmd = new AdminUserGlobalSignOutCommand({
                UserPoolId: userpool, 
                Username: username, 
            });
    
            const signOutResponse = await client.send(adminSignOutCmd);
            console.log('Admin Global Sign Out Status Code: ', signOutResponse?.$metadata.httpStatusCode);
        } catch (e) {
            console.log(`Error fetching credentials ${e.message.substring(0, 500)}`);
        }

        const logoutUrl = `${cognitoEndpoint}/logout?response_type=code&client_id=${clientId}&redirect_uri=${redirectUrl}`;
        window.location.href = logoutUrl;
        window.sessionStorage.clear();
        window.localStorage.clear();
    };

const getCredentials = async (context) => {
    let credentials;
    try {
        if (!_.get(context, 'state.credentials')) {
            credentials = await provideCredentials(context);
            return credentials;
        }
        if (context.state.credentials.expiration && new Date(context.state.credentials.expiration) <= new Date()) {
            credentials = await provideCredentials(context);
            return credentials;
        }
        return context.state.credentials;
    } catch (e) {
        console.log(`Error getting credentials ${e.message.substring(0, 500)}`);
        if (e.message.match('Token expired') || e.message.match('inactive')) {
            await context.dispatch('refreshTokens');
            return await provideCredentials(context);
        }
        throw e;
    }
};

const refreshTokens = async (context) => {
    console.log('refreshing tokens');
    const refresh_token = window.sessionStorage.getItem('refresh_token');
    const endpoint = context.rootState.info._links.CognitoEndpoint.href;
    const clientId = context.rootState.info.ClientIdDesigner;

    try {
        const tokens = await axios({
            method: 'POST',
            url: `${endpoint}/oauth2/token`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: query.stringify({
                grant_type: 'refresh_token',
                client_id: clientId,
                refresh_token,
            }),
        });

        window.sessionStorage.setItem('id_token', tokens.data.id_token);
        window.sessionStorage.setItem('access_token', tokens.data.access_token);
        window.sessionStorage.setItem('refresh_token', tokens.data.refresh_token);
        context.state.token = tokens.data.id_token;
    } catch (e) {
        const loginUrl = _.get(context, 'rootState.info._links.DesignerLogin.href');
        const result = window.confirm('Your credentials have expired, please log back in. Click Ok to be redirected to the login page.');
        if (result) {
            await context.dispatch('logout');
            window.location.href = loginUrl;
        }
    }
};

module.exports = { refreshTokens, getCredentials, logout, login };
