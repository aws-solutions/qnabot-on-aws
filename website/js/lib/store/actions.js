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

const Promise = require('bluebird');
const axios = require('axios');
const vue = require('vue');

module.exports = {
    bootstrap(context) {
        return Promise.resolve(axios.head(window.location.href))
            .then((result) => {
                const stage = result.headers['api-stage'];
                return Promise.resolve(axios.get(`/${stage}`))
                    .get('data')
                    .then((x) => Object.assign(x, { stage }));
            })
            .then((result) => {
                context.commit('info', result);
            });
    },
};
