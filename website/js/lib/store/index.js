/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

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
