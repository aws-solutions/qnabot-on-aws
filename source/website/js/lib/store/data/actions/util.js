/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

import { Validator } from 'jsonschema';
import axios from 'axios';
import _ from 'lodash';

const validator = new Validator();

export const api = function (context, name, args) {
    return context.dispatch(`api/${name}`, args, { root: true });
};
export const parse = function (item, context) {
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

export const handle = function (reason) {
    const self = this;
    return function (err) {
        console.log('Error:', err);
        self.commit('setError', reason, { root: true });
        return Promise.reject(reason);
    };
};
export const load = async function (list) {
    const self = this;
    try {
        const results = await Promise.resolve(list);
        if (!results.qa) {
            throw new Error('Failed to access qa in the list');
        }
        results.qa.forEach((result) => {
            self.commit('addQA', parse(result, self));
            self.commit('page/setTotal', self.state.QAs.length, { root: true });
        });
    } catch (e) {
        console.log('Error:', e);
        throw new Error('Failed to load');
    }
};

export default {
    api,
    parse,
    handle,
    load
};
