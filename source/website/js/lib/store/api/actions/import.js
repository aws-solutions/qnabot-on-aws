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
const _ = require('lodash');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const util = require('./../../../../capability/util');

module.exports = {
    async listExamples(context) {
        const response = await context.dispatch('_request', {
            url: context.rootState.info._links.examples.href,
            method: 'get',
        });
        const examples = await Promise.all(response.examples.map(async (example) => {
            if (_.get(example, 'description.href')) {
                example.text = await context.dispatch('_request', {
                    url: example.description.href,
                    method: 'get',
                });
            }
            return example;
        }));
        return examples;
    },
    async getExampleDescription(context, example) {
        if (_.get(example, 'description.href')) {
            return await context.dispatch('_request', {
                url: example.description.href,
                method: 'get',
            });
        }
    },
    async startImport(context, opts) {
        const credentials = context.rootState.user.credentials;
        const s3 = new S3Client({
            customUserAgent : util.getUserAgentString(context.rootState.info.Version, 'C010'),
            region: context.rootState.info.region, credentials
        });
        const response = await context.dispatch('_request', {
            url: context.rootState.info._links.jobs.href,
            method: 'get',
        });
        return s3.send(new PutObjectCommand({
            Bucket: response._links.imports.bucket,
            Key: response._links.imports.uploadPrefix + opts.name,
            Body: opts.qa.map(JSON.stringify).join('\n'),
        }));
    },
    waitForImport(context, opts) {
        return new Promise(async (res, rej) => {
            await next(10);

            async function next(count) {
                try {
                    const response = await context.dispatch('_request', {
                        url: context.rootState.info._links.jobs.href,
                        method: 'get',
                    });
                    const result = await context.dispatch('_request', {
                        url: response._links.imports.href,
                        method: 'get',
                    });
                    const job = result.jobs.find((x) => x.id === opts.id);
                    if (job) {
                        res(job);
                    } else {
                        count > 0 ? setTimeout(() => next(--count), 200) : rej('timeout');
                    }
                } catch (error) {
                    rej(error);
                }
            }
        });
    },
    async listImports(context, opts) {
        const response = await context.dispatch('_request', {
            url: context.rootState.info._links.jobs.href,
            method: 'get',
        });
        return context.dispatch('_request', {
            url: response._links.imports.href,
            method: 'get',
        });
    },
    getImport(context, opts) {
        return context.dispatch('_request', {
            url: opts.href,
            method: 'get',
        });
    },
    deleteImport(context, opts) {
        return context.dispatch('_request', {
            url: opts.href,
            method: 'delete',
        });
    },
    getTerminologies(context, opts) {
        return context.dispatch('_request', {
            url: `${context.rootState.info._links.translate.href}/list`,
            method: 'post',
        });
    },
    startImportTranslate(context, opts) {
        return context.dispatch('_request', {
            url: `${context.rootState.info._links.translate.href}/import`,
            method: 'post',
            body:
            {
                name: opts.name,
                description: opts.description,
                file: opts.file,
            },
        });
    },
};
