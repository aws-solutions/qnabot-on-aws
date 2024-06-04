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

const validator = new (require('jsonschema').Validator)();
const axios = require('axios');
const util = require('./util');

const { api } = util;

module.exports = {
    async download(context) {
        try {
            const result = await api(context, 'list', { from: 'all' });
            console.log(result);
            const blob = new Blob(
                [JSON.stringify({ qna: result.qa }, null, 3)],
                { type: 'text/plain;charset=utf-8' },
            );
            return blob;
        } catch (e) {
            console.log('Error:', e);
            throw new Error('Failed to download');
        }
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
    async downloadSelect(context) {
        try {
            const filter = context.state.selectIds.map((literal_string) => literal_string.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, '\\$&')).join('|');
            const result = await api(context, 'list', { from: 'all', filter: `(${filter})` });
            console.log(result);
            const blob = new Blob(
                [JSON.stringify({ qna: result.qa }, null, 3)],
                { type: 'text/plain;charset=utf-8' },
            );
            return blob;
        } catch (e) {
            console.log('Error:', e);
            throw new Error('Failed to download the select');
        }
    },
    async upload(context, params) {
        try {
            let out;
            if (params.data) {
                out = await context.dispatch('uploadProcess', { data: params.data });
            } else if (params.url) {
                out = await context.dispatch('uploadUrl', { url: params.url });
            } else {
                return Promise.reject('invalid params');
            }
            return out;
        } catch (e) {
            console.log('Error:', e);
            throw new Error('Failed to upload');
        }
    },
    async uploadProcess(context, { data }) {
        try {
            const v = validator.validate(data, require('./schema.json'));
            await (async () => {
                if (v.valid) {
                    return api(context, 'bulk', data);
                }
                console.log(v);
                return Promise.reject(`Invalid QnA:${v.errors.map((err) => err.stack).join(',')}`);
            })();
            context.commit('clearQA');
            await new Promise((res) => setTimeout(res, 2000));
            return context.dispatch('get', 0);
        } catch (e) {
            console.log('Error:', e);
            throw new Error('Failed in upload process');
        }
    },
    async uploadUrl(context, { url }) {
        try {
            const response = await Promise.resolve(axios.get(url));
            const { data } = response;
            return context.dispatch('upload', { data });
        } catch (e) {
            console.log('Error:', e);
            throw new Error('Error: please check URL and source CORS configuration');
        }
    },
};
