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

const Promise = require('bluebird');
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
exports.load = function (list) {
    const self = this;
    return Promise.resolve(list)
        .get('qa')
        .each((result) => {
            self.commit('addQA', exports.parse(result, self));
            self.commit('page/setTotal', self.state.QAs.length, { root: true });
        })
        .tapCatch((e) => console.log('Error:', e))
        .catchThrow('Failed to load');
};
