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
