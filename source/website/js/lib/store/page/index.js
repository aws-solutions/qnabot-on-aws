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
        loaded: 0,
        mode: 'questions',
        current: 0,
        perpage: 15,
        total: 0,
    },
    mutations,
    getters,
    actions,
};
