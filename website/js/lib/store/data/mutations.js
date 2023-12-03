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
    close(store) {
        const check = (el) => el.text === el.tmp;

        const any = store.QAs.map((qa) => qa.questions.map(check).concat([
            check(qa.answer),
            check(qa.qid),
            check(qa.card.imageUrl),
            check(qa.card.title),
        ]).includes(false)).includes(true);

        if (any) {
            store.commit('setError', 'Please save or cancel your work', { root: true });
            return false;
        }
        store.QAs.forEach((qa) => {
            qa.open = false;
            qa.edit = false;
        });
        return true;
    },
    selectAll(store, value) {
        store.QAs.map((x) => x.select = value);
    },
    setFilter(store, query) {
        store.filter = query;
    },
    clearFilter(store) {
        store.filter = null;
    },
    addQA(state, qa) {
        set(qa, 'selected', false);
        state.QAs.unshift(qa);
    },
    schema(state, schema) {
        state.schema = schema;
    },
    delQA(state, QA) {
        const index = state.QAs.findIndex((qa) => qa.qid === QA.qid);
        state.QAs.splice(index, 1);
    },
    clearQA(state) {
        state.QAs = [];
    },
    results(state, new_results) {
        state.results = new_results;
    },
};
