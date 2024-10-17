/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const axios = require('axios');
const vue = require('vue');

module.exports = {
    async bootstrap(context) {
        const result = await Promise.resolve(axios.head(window.location.href));
        const stage = result.headers['api-stage'];
        const x = await Promise.resolve(axios.get(`/${stage}`));
        const assigned = Object.assign(x.data, { stage });
        context.commit('info', assigned);
    },
};
