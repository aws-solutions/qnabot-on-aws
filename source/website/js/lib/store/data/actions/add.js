/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const util = require('./util');

const { api } = util;

async function next(count, res, rej, context, result) {
    try {
        const info = await api(context, 'botinfo');
        if (info.build.token === result.token) {
            context.rootState.bot.status = info.build.status;
            context.rootState.bot.build.message = info.build.message;
            if (info.build.status === 'READY') {
                res();
            } else if (info.build.status === 'Failed') {
                rej(`build failed:${info.build.message}`);
            } else {
                count > 0 ? setTimeout(async () => await next(--count, res, rej, context, result), 1000)
                    : rej(' build timed out');
            }
        } else {
            context.rootState.bot.status = 'Waiting';
            count > 0 ? setTimeout(async () => await next(--count, res, rej, context, result), 1000)
                : rej(' build timed out');
        }
    } catch (e) {
        rej(e);
    }
}

module.exports = {
    async build(context) {
        context.rootState.bot.status = 'Submitting';
        context.rootState.bot.build.message = '';
        context.rootState.bot.build.token = '';
        context.rootState.bot.build.status = '';
        try {
            let result = await api(context, 'botinfo');
            if (result.status === 'READY') {
                result = await api(context, 'build');
                context.rootState.bot.build.token = result.token;
            } else if (result.status === 'BUILDING') {
                return;
            } else {
                return Promise.reject(`cannot build, bot in state ${result.status}`);
            }
            await new Promise((res) => setTimeout(res, 200));
            context.rootState.bot.build.token = result.token;
            await new Promise((res, rej) => {
                next(60 * 5, res, rej, context, result);
            });
        } catch (e) {
            util.handle.bind(context)('Failed to Build')(e);
            throw e;
        }
    },
    async update(context, qa) {
        return await api(context, 'update', clean(_.omit(qa, ['select', '_score'])));
    },
    async add(context, qa) {
        await api(context, 'update', clean(qa));
        context.commit('page/incrementTotal', null, { root: true });
    },
};

function clean(obj) {
    if (typeof obj === 'object') {
        for (const key in obj) {
            obj[key] = clean(obj[key]);
        }
        return obj;
    }
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = clean(obj[i]);
        }
    } else if (obj.trim) {
        return obj.trim();
    } else {
        return obj;
    }
}
