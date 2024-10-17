/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import app from './client.vue';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/material-icons';
const { createApp } = require('vue');
const { aliases, md } = require('vuetify/iconsets/md');
const components = require('vuetify/components');
const directives = require('vuetify/directives');
const { createVuetify } = require('vuetify');
const { createStore } = require('vuex');
require('vuetify/styles');
const axios = require('axios');
require('aws-lex-web-ui/dist/lex-web-ui.min.css');
const Auth = require('./lib/client-auth');

let store = null;
let authConfig = null;

const config = {
    cognito: {},
    lex: {
        initialText: 'Ask a Question',
        initialSpeechInstruction: '',
        reInitSessionAttributesOnRestart: false,
    },
    ui: {
        pageTitle: 'QnABot Client',
        toolbarColor: 'cyan',
        toolbarTitle: 'QnABot',
        toolbarLogo: null,
        pushInitialTextOnRestart: false,
        AllowSuperDangerousHTMLInMessage: true,
        showDialogStateIcon: false,
        shouldDisplayResponseCardTitle: false,
        positiveFeedbackIntent: 'Thumbs up',
        negativeFeedbackIntent: 'Thumbs down',
        helpIntent: 'Help',
        messageMenu: true,
    },
    recorder: {},
};

const checkExpiringSessionPlugin = {
    install() {
        // Compute the session timeout (in milliseconds) using the
        // difference between the current timestamp and the expiration timestamp
        const sessionTimeout = authConfig.credentials.expiration - Date.now();

        if (sessionTimeout > 0) {
            setTimeout(() => {
                // Note: This is a workaround for the fact that the underlying
                // lex-web-ui library does not currently support refreshing
                // the session token.
                // Tell the user to manually start a new session when the current
                // session has expired.
                store.dispatch(
                    'pushErrorMessage',
                    'Your session has expired. Please start a new session.',
                );
            }, sessionTimeout);
        }
    },
};

document.addEventListener('DOMContentLoaded', () => {
    const Config = Promise.resolve(axios.head(window.location.href))
        .then((result) => {
            const stage = result.headers['api-stage'];
            return Promise.resolve(axios.get(`/${stage}`)).then((x) => x.data);
        })
        .then((result) => {
            config.cognito.poolId = result.PoolId;
            config.cognito.appUserPoolName = result.UserPool;
            config.lex.botName = result.BotName;
            config.lex.botAlias = result.BotVersion;
            config.lex.v2BotId = result.v2BotId;
            config.lex.v2BotAliasId = result.v2BotAliasId;
            config.lex.v2BotLocaleId = result.v2BotLocaleId;
            return config;
        });

    Promise.all([
        Config,
        Auth(),
    ])
        .then((results) => {
            const configResult = results[0];
            const auth = results[1];
            const LexWebUi = require('aws-lex-web-ui/dist/lex-web-ui.min.js');
            const App = createApp(app);
            const vuetify = createVuetify({
                components,
                directives,
                icons: {
                    defaultSet: 'md',
                    aliases,
                    sets: {
                        md,
                    },
                },
            });
            App.use(vuetify);
            store = createStore(LexWebUi.Store);
            App.use(store);
            if (auth.username) {
                config.ui.toolbarTitle += ` [${auth.username}]`;
            }
            config.lex.sessionAttributes = {
                idtokenjwt: auth.idtoken,
            };
            authConfig = auth.config;
            App.use(LexWebUi.Plugin, {
                config: configResult,
                awsConfig: auth.config,
                lexRuntimeClient: auth.lexV1,
                LexRuntimeV2Client: auth.lexV2,
                pollyClient: auth.polly,
            });
            App.use(checkExpiringSessionPlugin);
            App.mount('#App');
        });
});
