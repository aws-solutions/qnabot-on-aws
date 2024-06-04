/* eslint-disable max-len */
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

import app from './admin.vue';
const Idle = require('idle-js');

const { createApp } = require('vue');
require('highlight.js/styles/solarized-light.css');

const { createRouter } = require('vue-router');
const { sync } = require('vuex-router-sync');
const { createVuetify } = require('vuetify');
const components = require('vuetify/components');
const directives = require('vuetify/directives');
const { aliases, md } = require('vuetify/iconsets/md');
require('vuetify/styles');
require('../styles/app.css');
const lib = require('./lib');
const store = require('./lib/store');

const router = createRouter(lib.router);

sync(store, router);

const App = createApp(app);

const vuetify = createVuetify({
    components,
    directives,
    theme: {
        themes: {
            light: {
                colors: {
                    primary: '#1fbcd3',
                    accent: '#ffbb00',
                    secondary: '#3157d5',
                    info: '#0D47A1',
                    warning: '#ffba21',
                    error: '#a71000',
                    success: '#1ddf48',
                    anchor: '#1fbcd3',
                },
            },
        },
    },
    icons: {
        defaultSet: 'md',
        aliases,
        sets: {
            md,
        },
    },
    defaults: {
        VCard: {
            VCardActions: {
                VBtn: { class: 'font-weight-bold' },
            },
        },
        VProgressLinear: {
            height: 7,
            color: 'primary',
        },
    },
});
App.use(vuetify);
App.use(store);

const idlePlugin = {
    install() {
        const idle = new Idle({
            idle: 45 * 60 * 1000,
            events: ['mousemove', 'keydown', 'mousedown', 'touchstart'],
            onIdle() {
                window.alert('Sorry, you are being logged out for being idle. Please log back in');
                store.dispatch('user/logout');
                window.location = store.state.info._links.DesignerLogin.href;
            },
            keepTracking: true,
            startAtIdle: false,
        });
        idle.start();
    },
};
App.use(idlePlugin);

App.use(router);
router.replace('/loading');

store.state.modal = App.$modal;
router.isReady().then(App.mount('#App')).catch((error) => {
    console.log(error);
});
