/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const Vuex = require('vuex');
const { createStore } = require('vuex');

module.exports = createStore({
    state: {
        info: {},
        bot: {
            status: '',
            message: '',
            utterances: [],
            alexa: {},
            connect: {},
            genesys: {},
        },
        alexa: {},
        connect: {},
        genesys: {},
        error: '',
    },
    mutations: require('./mutations'),
    getters: require('./getters'),
    actions: require('./actions'),
    modules: {
        user: require('./user'),
        api: require('./api'),
        data: require('./data'),
        page: require('./page'),
    },
});
