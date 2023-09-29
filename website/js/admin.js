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
import IdleVue from 'idle-vue';
import VueClipboard from 'vue-clipboard2';
import app from './admin.vue';

const Promise = require('bluebird');

Promise.config({
    warnings: false,
});
const Vue = require('vue');
let style = require('highlight.js/styles/solarized-light.css');
const Router = require('vue-router').default;
const { sync } = require('vuex-router-sync');
const Vuex = require('vuex').default;
const Idle = require('idle-js');
const validate = require('vee-validate');
const _ = require('lodash');

Vue.use(validate, {
    classNames: {
        valid: 'valid',
        invalid: 'invalid',
    },
    events: 'input|blur|focus',
});

Vue.use(VueClipboard);
Vue.use(Vuex);
Vue.use(Router);
Vue.use(Vuetify, {
    theme: {
        primary: '#1fbcd3',
        accent: '#ffbb00',
        secondary: '#3157d5',
        info: '#0D47A1',
        warning: '#ffba21',
        error: '#a71000',
        success: '#1ddf48',
    },
});

style = require('../style/app.styl');
const lib = require('./lib');

document.addEventListener('DOMContentLoaded', init);

function init() {
    const router = new Router(lib.router);
    const { store } = lib;
    sync(store, router);
    router.replace('/loading');

    Vue.use(IdleVue, {
        idleTime: 45 * 60 * 1000,
        eventEmitter: new Vue(),
        store,
        startAtIdle: false,
    });

    const App = new Vue({
        router,
        store,
        render: (h) => h(app),
    });

    require('./lib/validator')(App);
    store.state.modal = App.$modal;
    router.onReady(() => App.$mount('#App'));
}
