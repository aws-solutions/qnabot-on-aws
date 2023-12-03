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
const validator = new (require('jsonschema').Validator)();
const axios = require('axios');
const util = require('./util');

const { api } = util;

module.exports = {
    removeQ(context, { index, item }) {
        item.questions.splice(index, 1);
        context.dispatch('update', { qa: item })
            .tapCatch((e) => console.log('Error:', e))
            .catchThrow('Failed to remove');
    },
    removeQA(context, QA) {
        const index = context.state.QAs.findIndex((qa) => qa.qid === QA.qid);
        if (index >= 0) {
            return api(context, 'remove', QA.qid)
                .then(() => context.commit('delQA', QA))
                .then(() => context.commit('page/decrementTotal', null, { root: true }))
                .tapCatch((e) => console.log('Error:', e));
        }
        return Promise.resolve();
    },
    removeQAs(context, QAs) {
        const qids = QAs.map((x) => x.qid);
        return new Promise((res, rej) => {
            if (qids.length > 0) {
                api(context, 'removeBulk', qids)
                    .then(res).catch(rej);
            } else {
                res();
            }
        })
            .tap(() => context.state.QAs = context.state.QAs.filter((x) => !qids.includes(x.qid)))
            .then(() => context.commit('page/decrementTotal', qids.length, { root: true }))
            .tapCatch((e) => console.log('Error:', e));
    },
    removeFilter(context) {
        const filter = context.state.filter ? `${context.state.filter}.*` : '.*';

        return api(context, 'removeQuery', filter)
            .delay(2000)
            .tap(() => {
                context.commit('clearQA');
                context.commit('clearFilter');
                return context.dispatch('get', {});
            })
            .tapCatch((e) => console.log('Error:', e))
            .catchThrow('Failed to remove');
    },
};
