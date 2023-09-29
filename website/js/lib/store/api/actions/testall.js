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

module.exports = {
    async startTestAll(context, opts) {
        const info = await context.dispatch('_request', {
            url: context.rootState.info._links.jobs.href,
            method: 'get',
        });
        const body = opts.filter ? { filter: `${opts.filter}.*` } : {};
        body.token = `${opts.token}`;
        await context.dispatch('_request', {
            url: `${info._links.testall.href}/${opts.name}`,
            method: 'put',
            body,
        });
    },
    async downloadTestAll(context, opts) {
        aws.config.credentials = context.rootState.user.credentials;
        const s3 = new aws.S3({ region: context.rootState.info.region });
        const result = await s3.getObject({
            Bucket: opts.bucket,
            Key: opts.key,
        }).promise();
        return (result.Body.toString());
    },
    waitForTestAll(context, opts) {
        return new Promise(async (res, rej) => {
            await next(10);

            async function next(count) {
                try {
                    const response = await context.dispatch('_request', {
                        url: context.rootState.info._links.jobs.href,
                        method: 'get',
                    })
                    const result = await context.dispatch('_request', {
                        url: response._links.testall.href,
                        method: 'get',
                    })
                    const job = result.jobs.find((x) => x.id === opts.id)
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
    async listTestAll(context, opts) {
        const response = await context.dispatch('_request', {
            url: context.rootState.info._links.jobs.href,
            method: 'get',
        })
        return context.dispatch('_request', {
                url: response._links.testall.href,
                method: 'get',
            });
    },
   async getTestAll(context, opts) {
        return context.dispatch('_request', {
            url: opts.href,
            method: 'get',
        });
    },
    async deleteTestAll(context, opts) {
        return context.dispatch('_request', {
            url: opts.href,
            method: 'delete',
        });
    },
};
