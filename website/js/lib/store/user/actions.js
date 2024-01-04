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
const { set } = require('vue');
const query = require('query-string');
const { fromCognitoIdentityPool } = require('@aws-sdk/credential-providers');

module.exports = {
    async refreshTokens(context) {
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
            console.log('token', tokens);
            window.sessionStorage.setItem('id_token', tokens.data.id_token);
            window.sessionStorage.setItem('access_token', tokens.data.access_token);
            window.sessionStorage.setItem('refresh_token', tokens.data.refresh_token);
            context.state.token = tokens.data.id_token;
        } catch (e) {
            const login = _.get(context, 'rootState.info._links.DesignerLogin.href');
            const result = window.confirm('Your credentials have expired, please log back in. Click Ok to be redirected to the login page.');
            if (result) {
                context.dispatch('logout');
                window.window.location.href = login;
            }
        }
    },
    getCredentials: async (context) => {
        let credentials;
        try {
            if (!_.get(context, 'state.credentials')) {
                credentials = await getCredentials(context);
                return credentials;
            }
            if (context.state.credentials.expiration && new Date(context.state.credentials.expiration) <= new Date()) {
                credentials = await getCredentials(context);
                return credentials;
            }
            return context.state.credentials;
        } catch (e) {
            console.log(e);
            if (e.message.match('Token expired') || e.message.match('inactive')) {
                await context.dispatch('refreshTokens');
                return await getCredentials(context);
            }
            throw e;
        }
    },
    logout(context) {
        window.sessionStorage.clear();
    },
    async login(context) {
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
            const login = _.get(context.rootState, 'info._links.DesignerLogin.href');
            window.alert('You must be an administrative user to view this page');
            window.window.location.href = login;
        }
    },
};
async function getCredentials(context) {
    const Logins = {};
    Logins[[
        'cognito-idp.',
        context.rootState.info.region,
        '.amazonaws.com/',
        context.rootState.info.UserPool,
    ].join('')] = context.state.token;
    const credentialProvider = await fromCognitoIdentityPool({
        identityPoolId: context.rootState.info.PoolId,
        logins: Logins,
        clientConfig: { region: context.rootState.info.region },
    })
    const credentials = await credentialProvider();
    context.state.credentials = credentials;
    return context.state.credentials;
}
async function getTokens(context, code) {
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
        const login = _.get(context, 'rootState.info._links.DesignerLogin.href');
        const result = window.confirm('Unable to fetch credentials, please log back in. Click Ok to be redirected to the login page.');
        if (result) {
            context.dispatch('logout');
            window.window.location.href = login;
        }
    }
}
