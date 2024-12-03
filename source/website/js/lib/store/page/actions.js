/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const validator = new (require('jsonschema').Validator)();
const axios = require('axios');
const util = require('./util');

const { api } = util;

module.exports = {
    setMode(context, mode) {
        context.commit('setMode', mode);
        if (mode === 'questions') {
            context.dispatch('goToPage', context.state.current);
        }
    },
    async goToPage(context, index) {
        context.commit('data/clearQA', null, { root: true });
        context.commit('setPage', index);
        try {
            await context.dispatch('data/get', index, { root: true });
        } catch (error) {
            console.log('Error:', error);
            throw new Error(('Failed to Build'));
        }
    },
    nextPage(context) {
        let index = context.state.current + 1;
        const total = Math.ceil(context.state.total / context.state.perpage);
        index = index > total - 1 ? total - 1 : index;
        return context.dispatch('goToPage', index);
    },
    previousPage(context) {
        let index = context.state.current - 1;
        index = index < 0 ? 0 : index;
        return context.dispatch('goToPage', index);
    },
};
