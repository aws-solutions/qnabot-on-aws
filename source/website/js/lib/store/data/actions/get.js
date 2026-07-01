/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

import util from './util.js';
import _ from 'lodash';

const { api } = util;

export default {
    async schema(context) {
        try {
            const x = await api(context, 'schema');
            context.commit('schema', x);
        } catch (error) {
            console.error('Error fetching schema:', error);
            throw error;
        }
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
