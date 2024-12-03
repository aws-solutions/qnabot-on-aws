/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
        qa.selected = false;
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
    loading(state, val) {
        state.loading = val;
    }
};
