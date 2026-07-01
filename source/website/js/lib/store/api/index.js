/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

import actions from './actions';

export default {
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
    actions,
};
