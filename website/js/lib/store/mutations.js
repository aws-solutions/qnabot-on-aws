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

const { set } = require('vue');

module.exports = {
    captureHash(state) {
        state.hash = location.hash.substring(1);
    },
    info(state, payload) {
        state.info = payload;
    },
    bot(state, payload) {
        const tmp = state.bot.utterances;
        state.bot = payload;
        set(state.bot, 'utterances', tmp);
    },
    utterances(state, payload) {
        set(state.bot, 'utterances', payload);
    },
    alexa(state, payload) {
        set(state.bot, 'alexa', payload);
    },
    setBotInfo(store, data) {
        data.lambdaName = data.lambdaArn.match(/arn:aws:lambda:.*:.*:function:(.*)/)[1];
        store.bot = data;
    },
    setError(store, message) {
        store.error = message;
    },
    clearError(store) {
        store.error = null;
    },
};
