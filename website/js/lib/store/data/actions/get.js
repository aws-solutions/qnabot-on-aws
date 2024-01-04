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
    async schema(context) {
        const x = await api(context, 'schema');
        context.commit('schema', x);
    },
    async botinfo(context) {
        try {
            const data = await api(context, 'botinfo');
            context.commit('bot', data, { root: true });
            const alexa = await api(context, 'alexa');
            context.commit('alexa', alexa, { root: true });
        } catch (e) {
            console.log('Error:', e);
            throw new Error('Failed get BotInfo');
        }
    },
    async search(context, opts) {
        try {
            _.defaults(opts, {
                query: opts.query,
                topic: opts.topic,
                perpage: opts.perpage,
            });
            const result = await api(context, 'search', opts);
            context.commit('clearQA');
            context.state.QAs = result.qa.map((x) => util.parse(x, context));
            context.commit('page/setTotal', result.total, { root: true });
            return result.qa.length;
        } catch (e) {
            console.log('Error:', e);
            throw new Error('Failed to search');
        }
    },
    async get(context, opts = {}) {
        try {
            context.commit('loading', "primary");
            _.defaults(opts, {
                filter: context.state.filter || '.*',
                order: opts.order || 'asc',
                perpage: opts.perpage,
            });
            const result = await api(context, 'list', opts);
            context.commit('clearQA');
            context.state.QAs = result.qa.map((x) => util.parse(x, context));
            context.commit('page/setTotal', result.total, { root: true });
            return result.qa.length;
        } catch (e) {
            console.log('Error:', e);
            throw new Error('Failed to get');
        } finally {
            context.commit('loading', false);
        }
    },
    async getAll(context) {
        context.commit('clearQA');
        return new Promise((resolve, reject) => {
            const next = (index) => context.dispatch('get', { page: index })
                .then((count) => (count < 1 ? resolve() : next(++index)))
                .catch((err) => reject(err));
            next(0);
        })
            .catch((e) => {
                console.log('Error:', e);
                throw new Error('Failed to getAll');
            });
    },
};
