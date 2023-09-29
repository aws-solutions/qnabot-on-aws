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
const util = require('./util');

const { api } = util;

module.exports = {
    download(context) {
        return api(context, 'list', { from: 'all' })
            .then((result) => {
                console.log(result);
                const blob = new Blob(
                    [JSON.stringify({ qna: result.qa }, null, 3)],
                    { type: 'text/plain;charset=utf-8' },
                );
                return blob;
            })
            .tapCatch((e) => console.log('Error:', e))
            .catchThrow('Failed to Download');
    },
    downloadLocal(context) {
        const qna = context.state.QAs.map((qa) => ({
            q: qa.questions.map((item) => item.text),
            a: qa.answer.text,
            r: JSON.parse(qa.card.text),
            qid: qa.qid.text,
        }));
        const blob = new Blob(
            [JSON.stringify({ qna }, null, 3)],
            { type: 'text/plain;charset=utf-8' },
        );
        return Promise.resolve(blob);
    },
    downloadSelect(context) {
        const filter = context.state.selectIds.map((literal_string) => literal_string.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&')).join('|');

        return api(context, 'list', { from: 'all', filter: `(${filter})` })
            .then((result) => {
                console.log(result);
                const blob = new Blob(
                    [JSON.stringify({ qna: result.qa }, null, 3)],
                    { type: 'text/plain;charset=utf-8' },
                );
                return blob;
            })
            .tapCatch((e) => console.log('Error:', e))
            .catchThrow('Failed to Download');
    },
    upload(context, params) {
        let out;
        if (params.data) {
            out = context.dispatch('uploadProcess', { data: params.data });
        } else if (params.url) {
            out = context.dispatch('uploadUrl', { url: params.url });
        } else {
            out = Promise.reject('invalid params');
        }
        return out
            .tapCatch((e) => console.log('Error:', e));
    },
    uploadProcess(context, { data }) {
        const v = validator.validate(data, require('./schema.json'));

        return Promise.try(() => {
            if (v.valid) {
                return api(context, 'bulk', data);
            }
            console.log(v);
            return Promise.reject(`Invalide QnA:${v.errors.map((err) => err.stack).join(',')}`);
        })
            .then(() => {
                context.commit('clearQA');
            }).delay(2000)
            .then(() => context.dispatch('get', 0))
            .tapCatch((e) => console.log('Error:', e))
            .catchThrow('Failed to upload');
    },
    uploadUrl(context, { url }) {
        return Promise.resolve(axios.get(url))
            .get('data')
            .then((data) => context.dispatch('upload', { data }))
            .tapCatch((e) => console.log('Error:', e))
            .catchThrow('Error: please check URL and source CORS configuration');
    },
};
