/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const validator = new (require('jsonschema').Validator)();
const axios = require('axios');
const _ = require('lodash');

exports.api = function (context, name, args) {
    return context.dispatch(`api/${name}`, args, { root: true });
};
exports.parse = function (item, context) {
    _.defaults(item, {
        _score: 0,
        q: [],
        t: '',
        r: {
            title: '',
            text: '',
            url: '',
        },
        select: false,
    });
    return item;
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
    try {
        const results = await Promise.resolve(list);
        if (!results.qa) {
            throw new Error('Failed to access qa in the list');
        }
        results.qa.forEach((result) => {
            self.commit('addQA', exports.parse(result, self));
            self.commit('page/setTotal', self.state.QAs.length, { root: true });
        });
    } catch (e) {
        console.log('Error:', e);
        throw new Error('Failed to load');
    }
};
