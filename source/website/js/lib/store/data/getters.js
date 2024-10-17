/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = {
    selected(state) {
        return state.QAs.map((qa) => qa.select);
    },
    QAlist(state, getters, rootGetters) {
        if (rootGetters.page.mode !== 'test') {
            return state.QAs.sort((a, b) => {
                if (a.qid.text < b.qid.text) return -1;
                if (a.qid.text > b.qid.text) return 1;
                return 0;
            });
        }
        return state.QAs.sort((a, b) => b.score - a.score);
    },
};
