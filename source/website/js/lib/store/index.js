/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

import { createStore } from 'vuex';
import mutations from './mutations';
import getters from './getters';
import actions from './actions';
import user from './user';
import api from './api';
import data from './data';
import page from './page';

export default createStore({
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
    mutations,
    getters,
    actions,
    modules: {
        user,
        api,
        data,
        page,
    },
});
