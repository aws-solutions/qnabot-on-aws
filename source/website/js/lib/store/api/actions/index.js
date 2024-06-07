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
const query = require('query-string').stringify;
const _ = require('lodash');
const axios = require('axios');
const { sign } = require('aws4');
const { Mutex } = require('async-mutex');

const mutex = new Mutex();

let failed = false;

function handleTimeout(context, e) {
    const login = _.get(context, 'rootState.info._links.DesignerLogin.href');
    if (login && !failed) {
        failed = true;
        const result = window.confirm('Your credentials have expired. Click ok to be redirected to the login page.');
        if (result) {
            context.dispatch('user/logout', {}, { root: true });
            window.window.location.href = login;
        } else {
            throw e;
        }
    }
}

function handleError(e, context, opts) {
    const { status } = e.response;
    if (status === 403) {
        const login = _.get(context, 'rootState.info._links.DesignerLogin.href');
        if (login && !failed) {
            failed = true;
            const result = window.confirm('You need to be logged in to use this page. click ok to be redirected to the login page');
            if (result) window.window.location.href = login;
        } else {
            throw e;
        }
    } else {
        const messageObj = {
            response: _.get(e, 'response.data'),
            status: _.get(e, 'response.status'),
        };
        if (status === 404 && opts.ignore404) {
            throw new Error('does-not-exist');
        } else if (messageObj?.response?.type === 'Error') {
            throw new Error(messageObj?.response?.message)
        } else {
            window.alert('Request Failed: error response from endpoint');
            throw messageObj;
        }
    }
}

module.exports = Object.assign(
    require('./kendraIndex'),
    require('./export'),
    require('./import'),
    require('./settings'),
    require('./connect'),
    require('./genesys'),
    require('./testall'),
    {
        _request: async (context, opts) => {
            const url = new URL(opts.url);
            const request = {
                host: url.hostname,
                method: opts.method.toUpperCase(),
                url: url.href,
                path: url.pathname + url.search,
                service: 'execute-api',
                headers: opts.headers || {},
                region: context.rootState.info.region,
            };
            if (opts.body) {
                request.body = JSON.stringify(opts.body);
                request.data = opts.body;
                request.headers['content-type'] = 'application/json';
            }
            try {
                const credentials = await mutex.runExclusive(async () => context.dispatch('user/getCredentials', {}, { root: true }));
                const signed = sign(request, credentials);
                delete request.headers.Host;
                delete request.headers['Content-Length'];

                context.commit('loading', true);
                const result = await axios(signed);
                return result.data;
            } catch (e) {
                console.log(JSON.stringify(_.get(e, 'response', e), null, 2));
                if (e.response) {
                    handleError(e, context, opts);
                } else if (e.name === 'CredentialTimeout') {
                    handleTimeout(context, e);
                } else if (e.name === 'NotAuthorizedException') {
                    console.log('This user is not an authorized user.');
                } else {
                    window.alert('Unknown Error');
                    throw e;
                }
            } finally {
                context.commit('loading', false);
            }
        },
        botinfo(context) {
            return context.dispatch('_request', {
                url: context.rootState.info._links.bot.href,
                method: 'get',
                reason: 'Failed to get BotInfo',
            });
        },
        alexa(context) {
            return context.dispatch('_request', {
                url: context.rootState.bot._links.alexa.href,
                method: 'get',
                reason: 'Failed to get Alexa info',
            });
        },
        schema(context, body) {
            return context.dispatch('_request', {
                url: context.rootState.info._links.questions.href,
                method: 'options',
                reason: 'Failed to get qa options',
            });
        },
        list(context, opts) {
            console.log(`Calling list with opts: ${JSON.stringify(opts)}`);
            const perpage = opts.perpage || 100;
            return context.dispatch('_request', {
                url: `${context.rootState.info._links.questions.href}?${query({
                    from: (opts.page || 0) * perpage,
                    filter: opts.filter ? `${opts.filter}.*` : '',
                    order: opts.order,
                    perpage,
                })}`,
                method: 'get',
                reason: `Failed to get page:${opts.page}`,
            });
        },
        async check(context, qid) {
            try {
                await context.dispatch('_request', {
                    url: `${context.rootState.info._links.questions.href}/${encodeURIComponent(qid)}`,
                    method: 'head',
                    reason: `${qid} does not exists`,
                    ignore404: true,
                });
                return true;
            } catch (x) {
                if (x.message === 'does-not-exist') {
                    return false;
                }
                console.log(x);
                throw x;
            }
        },
        add(context, payload) {
            return context.dispatch('update', payload);
        },
        update(context, payload) {
            return context.dispatch('_request', {
                url: `${context.rootState.info._links.questions.href}/${encodeURIComponent(payload.qid)}`,
                method: 'put',
                body: payload,
                reason: 'failed to update',
            });
        },
        remove(context, qid) {
            return context.dispatch('_request', {
                url: `${context.rootState.info._links.questions.href}/${encodeURIComponent(qid)}`,
                method: 'delete',
                reason: 'failed to delete',
            });
        },
        removeBulk(context, list) {
            return context.dispatch('_request', {
                url: context.rootState.info._links.questions.href,
                method: 'delete',
                reason: 'failed to delete',
                body: { list },
            });
        },
        removeQuery(context, query) {
            return context.dispatch('_request', {
                url: context.rootState.info._links.questions.href,
                method: 'delete',
                reason: 'failed to delete',
                body: { query },
            });
        },
        build(context) {
            return context.dispatch('_request', {
                url: context.rootState.info._links.bot.href,
                method: 'post',
                body: {},
                reason: 'failed to build',
            });
        },
        status(context) {
            return context.dispatch('_request', {
                url: context.rootState.info._links.bot.href,
                method: 'get',
                reason: 'failed to get status',
            });
        },
        search(context, opts) {
            return context.dispatch('_request', {
                url: `${context.rootState.info._links.questions.href}?${query({
                    query: opts.query,
                    topic: opts.topic || '',
                    client_filter: opts.client_filter || '',
                    score_answer: (opts.score_on === 'qna item answer') ? 'true' : 'false',
                    score_text_passage: (opts.score_on === 'text item passage') ? 'true' : 'false',
                    from: opts.from || 0,
                })}`,
                method: 'get',
                reason: 'failed to get search',
            });
        },
    },
);
