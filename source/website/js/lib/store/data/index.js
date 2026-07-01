/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

import mutations from './mutations';
import getters from './getters';
import actions from './actions';

export default {
    namespaced: true,
    state: {
        QAs: [],
        schema: {},
        filter: '',
        loading: false,
    },
    mutations,
    getters,
    actions,
};
