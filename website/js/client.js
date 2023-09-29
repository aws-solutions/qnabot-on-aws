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
import Vuetify from 'vuetify';
import app from './client.vue';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/material-icons';

require('babel-polyfill');
const axios = require('axios');
const Vue = require('vue');
const Vuex = require('vuex').default;
const style = require('aws-lex-web-ui/dist/lex-web-ui.min.css');
const Auth = require('./lib/client-auth');

Vue.use(Vuex);
Vue.use(Vuetify);

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
document.addEventListener('DOMContentLoaded', () => {
    const Config = Promise.resolve(axios.head(window.location.href))
        .then((result) => {
            const stage = result.headers['api-stage'];
            return Promise.resolve(axios.get(`/${stage}`)).then((x) => x.data);
        })

        .then((result) => {
            config.cognito.poolId = result.PoolId;
            config.lex.botName = result.BotName;
            config.lex.botAlias = result.BotVersion;
            config.lex.v2BotId = result.v2BotId;
            config.lex.v2BotAliasId = result.v2BotAliasId;
            config.lex.v2BotLocaleId = result.v2BotLocaleId;
            console.log(config);
            return config;
        });

    Promise.all([
        Config,
        Auth(),
    ])
        .then((results) => {
            console.log(results);
            const config = results[0];
            const auth = results[1];

            const LexWebUi = require('aws-lex-web-ui/dist/lex-web-ui.js');
            const store = new Vuex.Store(LexWebUi.Store);
            if (auth.username) {
                config.ui.toolbarTitle += ` [${auth.username}]`;
            }
            config.lex.sessionAttributes = {
                idtokenjwt: auth.idtoken,
            };
            store.state.Login = auth.Login;
            store.state.Username = auth.username;
            Vue.use(LexWebUi.Plugin, {
                config,
                awsConfig: auth.config,
                lexRuntimeClient: auth.lex,
                pollyClient: auth.polly,
            });

            const App = new Vue({
                render: (h) => h(app),
                store,
            });
            App.$mount('#App');
        });
});
