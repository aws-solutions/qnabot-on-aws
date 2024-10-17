/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const Vuex = require('vuex');

module.exports = {
    namespaced: true,
    state: {
        loading: false,
    },
    mutations: {
        loading(state, val) {
            state.loading = val;
        },
    },
    getters: {},
    actions: require('./actions'),
};
