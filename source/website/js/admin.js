/* eslint-disable max-len */
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
