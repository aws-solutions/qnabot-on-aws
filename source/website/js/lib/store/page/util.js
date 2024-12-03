/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const validator = new (require('jsonschema').Validator)();
const axios = require('axios');

exports.api = function (context, name, args) {
    return context.dispatch(`api/${name}`, args, { root: true });
};
exports.parse = function (item, context) {
    if (!item.body.r) {
        item.body.r = {
            title: '',
            imageUrl: '',
        };
    }
    return {
        qid: {
            text: item.body.qid,
            tmp: item.body.qid,
        },
        answer: {
            text: item.body.a,
            tmp: item.body.a,
        },
        card: {
            text: JSON.stringify(item.body.r, null, 4) || '',
            title: {
                text: item.body.r.title || '',
                tmp: item.body.r.title || '',
            },
            imageUrl: {
                text: item.body.r.imageUrl || '',
                tmp: item.body.r.imageUrl || '',
            },
        },
        topic: {
            text: item.body.t || '',
            tmp: item.body.t || '',
        },
        questions: item.body.q.map((Q) => ({ text: Q, tmp: Q })),
        open: false,
        edit: false,
        select: context.state.selectIds.includes(item.body.qid),
        deleting: false,
        score: item.score || 0,
    };
};

exports.handle = function (reason) {
    const self = this;
    return function (err) {
        console.log('Error:', err);
        self.commit('setError', reason, { root: true });
        return Promise.reject(reason);
    };
};
exports.load = async function (list) {
    const self = this;
    self.commit('startLoading');
    try {
        const results = await Promise.resolve(list);
        if (!results.qa) {
            throw new Error('Failed to access qa in the list');
        }
        results.qa.forEach((result) => self.commit('addQA', parse(result, self)));
        self.commit('setTotal', self.state.QAs.length);
    } catch (e) {
        console.log('Error:', e);
        throw new Error('Failed to load');
    } finally {
        self.commit('stopLoading');
    }
};
