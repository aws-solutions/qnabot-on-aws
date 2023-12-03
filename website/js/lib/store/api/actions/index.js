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
const Promise = require('bluebird');
const axios = require('axios');
const Url = require('url');
const { sign } = require('aws4');
const path = require('path');
const { Mutex } = require('async-mutex');

const mutex = new Mutex();

const reason = function (r) {
    return (err) => {
        console.log(err);
        Promise.reject(r);
    };
};

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
        const message = {
            response: _.get(e, 'response.data'),
            status: _.get(e, 'response.status'),
        };
        if (status === 404 && opts.ignore404) {
            throw 'does-not-exist';
        } else {
            window.alert('Request Failed: error response from endpoint');
            throw message;
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
        _request: Promise.method(async (context, opts) => {
            const url = Url.parse(opts.url);
            const request = {
                host: url.hostname,
                method: opts.method.toUpperCase(),
                url: url.href,
                path: url.path,
                service: 'execute-api',
                headers: opts.headers || {},
                region: context.rootState.info.region
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
                } else if (e.code === 'CredentialTimeout') {
                    handleTimeout(context, e);
                } else {
                    window.alert('Unknown Error');
                    throw e;
                }
            } finally {
                context.commit('loading', false);
            }
        }),
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
        check(context, qid) {
            return context.dispatch('_request', {
                url: `${context.rootState.info._links.questions.href}/${encodeURIComponent(qid)}`,
                method: 'head',
                reason: `${qid} does not exists`,
                ignore404: true,
            })
                .then(() => true)
                .tapCatch(console.log)
                .catch((x) => x === 'does-not-exist', () => false);
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
