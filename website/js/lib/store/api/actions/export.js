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
const query = require('query-string').stringify;
const _ = require('lodash');
const axios = require('axios');
const Url = require('url');
const { sign } = require('aws4');
const path = require('path');
const { Mutex } = require('async-mutex');
const aws = require('aws-sdk');

const mutex = new Mutex();

const reason = function (r) {
    return (err) => {
        console.log(err);
        Promise.reject(r);
    };
};

function getParameters(ssm, params) {
    return new Promise((resolve, reject) => {
        ssm.getParameters(params, (err, data) => {
            if (err) {
                console.log(err, err.stack);
                reject(`Error back from request: ${err}`);
            } else {
                const custom_settings = JSON.parse(data.Parameters[0].Value);
                const default_settings = JSON.parse(data.Parameters[1].Value);
                const cloned_default = _.clone(default_settings);
                const merged_settings = _.merge(cloned_default, custom_settings);
                const settings = [default_settings, custom_settings, merged_settings];
                resolve(settings);
            }
        });
    });
}

async function listSettings(context) {
    aws.config.credentials = context.rootState.user.credentials;
    const customParams = context.rootState.info.CustomQnABotSettings;
    const defaultParams = context.rootState.info.DefaultQnABotSettings;
    const ssm = new aws.SSM({ region: context.rootState.info.region });
    const query = {
        Names: [customParams, defaultParams],
        WithDecryption: true,
    };
    const response = await getParameters(ssm, query);
    return response;
}

const failed = false;
module.exports = {
    async startExport(context, opts) {
        const info = await context.dispatch('_request', {
            url: context.rootState.info._links.jobs.href,
            method: 'get',
        });
        const settings = await listSettings(context);
        const merged = settings[2];
        let headers;
        if (merged.S3_PUT_REQUEST_ENCRYPTION && merged.S3_PUT_REQUEST_ENCRYPTION.length > 0) {
            headers = { 'x-amz-server-side-encryption': merged.S3_PUT_REQUEST_ENCRYPTION };
            console.log(`headers: ${headers}`);
        }
        await context.dispatch('_request', {
            url: `${info._links.exports.href}/${opts.name}`,
            method: 'put',
            headers: headers || undefined,
            body: opts.filter ? { filter: `${opts.filter}.*`, prefix: '' } : { prefix: '' },
        });
    },
    async startKendraSyncExport(context, opts) {
        console.log('Entering startKendraSyncExport function');
        const info = await context.dispatch('_request', {
            url: context.rootState.info._links.jobs.href,
            method: 'get',
        });

        await context.dispatch('_request', {
            url: `${info._links.exports.href}/${opts.name}`,
            method: 'put',
            body: opts.filter ? { filter: `${opts.filter}.*`, prefix: 'kendra-' } : { prefix: 'kendra-' },
        });
    },
    async downloadExport(context, opts) {
        aws.config.credentials = context.rootState.user.credentials;
        const s3 = new aws.S3({ region: context.rootState.info.region });
        const result = await s3.getObject({
            Bucket: opts.bucket,
            Key: opts.key,
        }).promise();

        const qa = result.Body.toString();
        return `{"qna":[${qa.replace(/\n/g, ',\n')}]}`;
    },
    waitForExport(context, opts) {
        return new Promise(async (res, rej) => {
            await next(10);

            async function next(count) {
                try {
                    const response = await context.dispatch('_request', {
                        url: context.rootState.info._links.jobs.href,
                        method: 'get',
                    })
                    const result = await context.dispatch('_request', {
                        url: response._links.imports.href,
                        method: 'get',
                    })
                    const job = result.jobs.find((x) => x.id === opts.id);
                    if (job) {
                        res(job);
                    } else {
                        count > 0 ? setTimeout(() => next(--count), 200) : rej('timeout');
                    }
                } catch (error) {
                    rej(error)
                }
            }
        });
    },
    async listExports(context, opts) {
        const response= await context.dispatch('_request', {
            url: context.rootState.info._links.jobs.href,
            method: 'get',
        })
            return context.dispatch('_request', {
                url: response._links.exports.href,
                method: 'get',
            });
    },
    async getExport(context, opts) {
        return context.dispatch('_request', {
            url: opts.href,
            method: 'get',
        });
    },
    async getExportByJobId(context, id) {
        return context.dispatch('_request', {
            url: `${context.rootState.info._links.jobs.href}/exports/${id}`,
            method: 'get',
        });
    },
    async deleteExport(context, opts) {
        return context.dispatch('_request', {
            url: opts.href,
            method: 'delete',
        });
    },
};
