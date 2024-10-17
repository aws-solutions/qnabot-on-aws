/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const util = require('../../../../capability/util');

module.exports = {
    async startTestAll(context, opts) {
        const info = await context.dispatch('_request', {
            url: context.rootState.info._links.jobs.href,
            method: 'get',
        });
        const body = opts.filter ? { filter: `${opts.filter}.*` } : {};
        body.token = `${opts.token}`;
        body.locale = `${opts.locale}` != '' ? `${opts.locale}` : 'en_US';
        await context.dispatch('_request', {
            url: `${info._links.testall.href}/${opts.name}`,
            method: 'put',
            body,
        });
    },
    async downloadTestAll(context, opts) {
        const credentials = context.rootState.user.credentials;
        const s3 = new S3Client({
            customUserAgent : util.getUserAgentString(context.rootState.info.Version, 'C012'),
            region: context.rootState.info.region, credentials
        });
        const result = await s3.send(new GetObjectCommand({
            Bucket: opts.bucket,
            Key: opts.key,
        }));
        const download = await result.Body.transformToString()
        return download;
    },
    waitForTestAll(context, opts) {
        return new Promise(async (res, rej) => {
            await next(10);

            async function next(count) {
                try {
                    const response = await context.dispatch('_request', {
                        url: context.rootState.info._links.jobs.href,
                        method: 'get',
                    });
                    const result = await context.dispatch('_request', {
                        url: response._links.testall.href,
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
    async listTestAll(context, opts) {
        const response = await context.dispatch('_request', {
            url: context.rootState.info._links.jobs.href,
            method: 'get',
        });
        return context.dispatch('_request', {
            url: response._links.testall.href,
            method: 'get',
        });
    },
    getTestAll(context, opts) {
        return context.dispatch('_request', {
            url: opts.href,
            method: 'get',
        });
    },
    deleteTestAll(context, opts) {
        return context.dispatch('_request', {
            url: opts.href,
            method: 'delete',
        });
    },
    getBotInfo(context) {
        return context.dispatch('_request', {
            url: context.rootState.info._links.bot.href,
            method: 'get',
            reason: 'Failed to get BotInfo',
        });
    },
};
