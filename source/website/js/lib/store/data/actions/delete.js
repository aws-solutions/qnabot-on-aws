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

const util = require('./util');

const { api } = util;

module.exports = {
    async removeQ(context, { index, item }) {
        try {
            item.questions.splice(index, 1);
            await context.dispatch('update', { qa: item });
        } catch (e) {
            console.log('Error:', e);
            throw new Error('Failed to remove');
        }
    },
    async removeQA(context, QA) {
        const index = context.state.QAs.findIndex((qa) => qa.qid === QA.qid);
        if (index >= 0) {
            try {
                await api(context, 'remove', QA.qid);
                context.commit('delQA', QA);
                context.commit('page/decrementTotal', null, { root: true });
            } catch (e) {
                console.log('Error:', e);
            }
        }
        return Promise.resolve();
    },
    async removeQAs(context, QAs) {
        try {
            const qids = QAs.map((x) => x.qid);
            if (qids.length > 0) {
                await api(context, 'removeBulk', qids);
            }
            context.state.QAs = context.state.QAs.filter((x) => !qids.includes(x.qid));
            context.commit('page/decrementTotal', qids.length, { root: true });
        } catch (e) {
            console.log('Error:', e);
        }
    },
    async removeFilter(context) {
        try {
            const filter = context.state.filter ? `${context.state.filter}.*` : '.*';
            await api(context, 'removeQuery', filter);
            await new Promise((res) => setTimeout(res, 2000));
            context.commit('clearQA');
            context.commit('clearFilter');
            await context.dispatch('get', {});
        } catch (e) {
            console.log('Error:', e);
            throw new Error('Failed to remove');
        }
    },
};
