/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import query from 'query-string';
import _ from 'lodash';
import axios from 'axios';
import {  sign  } from 'aws4';
import {  Mutex  } from 'async-mutex';
import kendraIndex from './kendraIndex.js';
import exportActions from './export.js';
import importActions from './import.js';
import settings from './settings.js';
import connect from './connect.js';
import genesys from './genesys.js';
import testall from './testall.js';
import schemas from '../../../schemas/index.js';

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
        handle403Error(context, e);
    } else {
        handleNon403Error(e, status, opts);
    }
}

function handle403Error(context, e) {
    const login = _.get(context, 'rootState.info._links.DesignerLogin.href');
    if (login && !failed) {
        failed = true;
        const result = window.confirm('You need to be logged in to use this page. click ok to be redirected to the login page');
        if (result) window.window.location.href = login;
    } else {
        throw e;
    }
}

function handleNon403Error(e, status, opts) {
    const messageObj = {
        response: _.get(e, 'response.data'),
        status: _.get(e, 'response.status'),
    };
    
    if (status === 404 && opts.ignore404) {
        throw new Error('does-not-exist');
    }
    
    if (messageObj?.response?.type === 'Error') {
        throw new Error(messageObj?.response?.message);
    }
    
    window.alert('Request Failed: error response from endpoint');
    throw messageObj;
}

// Helper: Determine URLs for dev mode
function resolveUrls(opts) {
    const isDevMode = import.meta.env.DEV && import.meta.env.VITE_PROXY_STAGE;
    
    if (!isDevMode) {
        return { fullUrl: opts.url, relativeUrl: opts.url, isDevMode: false };
    }
    
    const stage = import.meta.env.VITE_PROXY_STAGE;
    const target = import.meta.env.VITE_PROXY_TARGET;
    
    if (opts.url.startsWith('http')) {
        return resolveAbsoluteUrl(opts.url);
    }
    
    return resolveRelativeUrl(opts.url, target, stage);
}

function resolveAbsoluteUrl(url) {
    try {
        const urlObj = new URL(url);
        return {
            fullUrl: url,
            relativeUrl: urlObj.pathname + urlObj.search,
            isDevMode: true
        };
    } catch (e) {
        console.error('Failed to parse absolute URL:', url, e);
        return { fullUrl: url, relativeUrl: url, isDevMode: true };
    }
}

function resolveRelativeUrl(url, target, stage) {
    return {
        fullUrl: `${target}/${stage}${url}`,
        relativeUrl: url,
        isDevMode: true
    };
}

// Helper: Build signed request
function buildSignedRequest(fullUrl, opts, context) {
    const url = new URL(fullUrl);
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
    
    return request;
}

// Helper: Convert response links to relative URLs in dev mode
function convertResponseLinks(result) {
    if (!result.data || !result.data._links) {
        return;
    }
    
    const stage = import.meta.env.VITE_PROXY_STAGE;
    const skipConversion = ['CognitoEndpoint', 'OpenSearchDashboards'];
    
    Object.keys(result.data._links).forEach(key => {
        if (shouldConvertLink(result.data._links[key], key, skipConversion)) {
            result.data._links[key].href = convertLinkToRelative(result.data._links[key].href, stage);
        }
    });
}

function shouldConvertLink(link, key, skipConversion) {
    return link?.href && !skipConversion.includes(key);
}

function convertLinkToRelative(url, stage) {
    try {
        const urlObj = new URL(url);
        const relativePath = urlObj.pathname;
        return relativePath.replace(`/${stage}`, '');
    } catch (e) {
        return url;
    }
}

// Helper: Handle request errors
function handleRequestError(e, context, opts) {
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
}

export default Object.assign(
    kendraIndex,
    exportActions,
    importActions,
    settings,
    connect,
    genesys,
    testall,
    {
        _request: async (context, opts) => {
            const { fullUrl, relativeUrl, isDevMode } = resolveUrls(opts);
            const request = buildSignedRequest(fullUrl, opts, context);
            
            try {
                const credentials = await mutex.runExclusive(async () => context.dispatch('user/getCredentials', {}, { root: true }));
                const signed = sign(request, credentials);
                delete request.headers.Host;
                delete request.headers['Content-Length'];

                const requestUrl = isDevMode ? relativeUrl : signed.url;

                context.commit('loading', true);
                const result = await axios({
                    ...signed,
                    url: requestUrl
                });
                
                // Handle 204 No Content responses
                if (result.status === 204 && (!result.data || result.data === '')) {
                    return {};
                }
                
                // Convert response links in dev mode
                if (isDevMode) {
                    convertResponseLinks(result);
                }
                
                return result.data;
            } catch (e) {
                handleRequestError(e, context, opts);
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
            }).then(result => {
                // If we get an empty response from OPTIONS (204 No Content), 
                // the API Gateway is returning CORS headers only, not the schema.
                // This is a backend configuration issue, but we can work around it
                // by using the bundled schema definitions.
                if (!result || typeof result !== 'object' || Object.keys(result).length === 0) {
                    return schemas;
                }
                return result;
            });
        },
        list(context, opts) {
            const perpage = opts.perpage || 100;
            return context.dispatch('_request', {
                url: `${context.rootState.info._links.questions.href}?${query.stringify({
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
                url: `${context.rootState.info._links.questions.href}?${query.stringify({
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
