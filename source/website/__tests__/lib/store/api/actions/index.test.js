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
import exp from 'constants';
import mockedContext from './mockedContext';

const query = require('query-string').stringify;
const indexModule = require('../../../../../js/lib/store/api/actions/index');
const axios = require('axios');
const { sign } = require('aws4');

jest.mock('axios');
jest.mock('aws4');


describe('index action test', () => {
    class CustomError extends Error {
        constructor(message, response, code) {
            super(message);
            this.name = 'CustomError';
            this.response = response;
            this.code = code;
        }
    }

    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'log').mockImplementation(jest.fn());
    });

    test('_request', async () => {
        const opts = {
            url: 'https://example.com',
            method: 'GET',
            headers: {},
            body: '<body>Test</body>',
        };
        const successResult = {
            data: 'success',
        };
        axios.mockResolvedValueOnce(successResult);

        const result = await indexModule._request(mockedContext, opts);
        expect(result).toEqual(successResult.data);
    });

    test('_request with http 404 response error', async () => {
        const opts = {
            url: 'https://example.com',
            method: 'GET',
            headers: {},
            body: '<body>Test</body>',
            ignore404: true,
        };
        const customError = new CustomError('Test', { status: 404 });
        axios.mockImplementationOnce(() => {
            throw customError;
        });

        const resFunction = jest.fn();
        const rejFunction = jest.fn((error) => error);

        await indexModule._request(mockedContext, opts).then(resFunction, rejFunction);
        expect(resFunction).toHaveBeenCalledTimes(0);
        expect(rejFunction).toHaveBeenCalledTimes(1);
        expect(rejFunction).toHaveBeenCalledWith(new Error('does-not-exist'));
    });

    test('botinfo', () => {
        indexModule.botinfo(mockedContext);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.bot.href,
            method: 'get',
            reason: 'Failed to get BotInfo',
        });
    });

    test('alexa', () => {
        indexModule.alexa(mockedContext);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.bot._links.alexa.href,
            method: 'get',
            reason: 'Failed to get Alexa info',
        });
    });

    test('schema', () => {
        indexModule.schema(mockedContext, {});
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.questions.href,
            method: 'options',
            reason: 'Failed to get qa options',
    });
    });

    test('list with filter', () => {
        const opts = {
            perpage: 50,
            page: 1,
            filter: 'test filter',
            order: 'descending',
        };
        indexModule.list(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: `${mockedContext.rootState.info._links.questions.href}?${query({
                from: opts.page * opts.perpage,
                filter: `${opts.filter}.*`,
                order: opts.order,
                perpage: opts.perpage,
            })}`,
            method: 'get',
            reason: `Failed to get page:${opts.page}`,
        });
    });

    test('list without filter', () => {
        const opts = {
            perpage: 50,
            page: 1,
            filter: '',
            order: 'descending',
        };
        indexModule.list(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: `${mockedContext.rootState.info._links.questions.href}?${query({
                from: opts.page * opts.perpage,
                filter: '',
                order: opts.order,
                perpage: opts.perpage,
            })}`,
            method: 'get',
            reason: `Failed to get page:${opts.page}`,
        });
    });

    test('check finds qid', async () => {
        const resFunction = jest.fn((result) => result);
        const rejFunction = jest.fn();
        const qid = 'test-qid';
        await indexModule.check(mockedContext, qid).then(resFunction, rejFunction);
        expect(resFunction).toHaveBeenCalledTimes(1);
        expect(rejFunction).toHaveBeenCalledTimes(0);
        expect(resFunction).toHaveBeenCalledWith(true);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: `${mockedContext.rootState.info._links.questions.href}/${encodeURIComponent(qid)}`,
            method: 'head',
            reason: `${qid} does not exists`,
            ignore404: true,
});
    });

    test('check encounters does-not-exist error', async () => {
        const resFunction = jest.fn();
        const rejFunction = jest.fn();
        mockedContext.dispatch.mockImplementationOnce(() => {
            throw Error('does-not-exist');
        });
        await indexModule.check(mockedContext, 'test-qid').then(resFunction, rejFunction);
        expect(resFunction).toHaveBeenCalledTimes(1);
        expect(rejFunction).toHaveBeenCalledTimes(0);
    });

    test('check encounters any other error', async () => {
        const resFunction = jest.fn();
        const rejFunction = jest.fn();
        mockedContext.dispatch.mockImplementationOnce(() => {
            throw new Error('Some unknown test error message');
        });
        await indexModule.check(mockedContext, 'test-qid').then(resFunction, rejFunction);
        expect(resFunction).toHaveBeenCalledTimes(0);
        expect(rejFunction).toHaveBeenCalledTimes(1);
    });

    test('add', () => {
        indexModule.add(mockedContext, {});
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('update', {});
    });

    test('update', () => {
        const payload = { qid: 'test-qid' };
        indexModule.update(mockedContext, payload);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: `${mockedContext.rootState.info._links.questions.href}/${encodeURIComponent(payload.qid)}`,
            method: 'put',
            body: payload,
            reason: 'failed to update',
        });
    });

    test('remove', () => {
        const qid = 'test-id';
        indexModule.remove(mockedContext, qid);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: `${mockedContext.rootState.info._links.questions.href}/${encodeURIComponent(qid)}`,
            method: 'delete',
            reason: 'failed to delete',
        });
    });

    test('removeBulk', () => {
        const list = ['test-qid-1', 'test-qid-2'];
        indexModule.removeBulk(mockedContext, list);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.questions.href,
            method: 'delete',
            reason: 'failed to delete',
            body: { list },
        });
    });

    test('removeQuery', () => {
        const mockedQuery = { query: '' };
        indexModule.removeQuery(mockedContext, mockedQuery);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.questions.href,
            method: 'delete',
            reason: 'failed to delete',
            body: { query: mockedQuery },
        });
    });

    test('build', () => {
        indexModule.build(mockedContext);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.bot.href,
            method: 'post',
            body: {},
            reason: 'failed to build',
        });
    });

    test('status', () => {
        indexModule.status(mockedContext);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.bot.href,
            method: 'get',
            reason: 'failed to get status',
        });
    });

    test('search with defaults', () => {
        const opts = {
            query: {
                testAttribute: 'testValue',
            },
            topic: '',
            client_filter: '',
            score_on: '',
            from: 0,
        };
        const url = `${mockedContext.rootState.info._links.questions.href}?${query({
            query: opts.query,
            topic: '',
            client_filter: '',
            score_answer: 'false',
            score_text_passage: 'false',
            from: 0,
        })}`;
        indexModule.search(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: url,
            method: 'get',
            reason: 'failed to get search',
        });
    });

    test('search with non-defaults 1', () => {
        const opts = {
            query: {
                testAttribute: 'testValue',
            },
            topic: 'test-topic',
            client_filter: 'test client_filter',
            score_on: 'qna item answer',
            from: 2,
        };
        const url = `${mockedContext.rootState.info._links.questions.href}?${query({
            query: opts.query,
            topic: opts.topic,
            client_filter: opts.client_filter,
            score_answer: 'true',
            score_text_passage: 'false',
            from: opts.from,
        })}`;
        indexModule.search(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: url,
            method: 'get',
            reason: 'failed to get search',
        });
    });

    test('search with non-defaults 2', () => {
        const opts = {
            query: {
                testAttribute: 'testValue',
            },
            topic: 'test-topic',
            client_filter: 'test client_filter',
            score_on: 'text item passage',
            from: 2,
        };
        const url = `${mockedContext.rootState.info._links.questions.href}?${query({
            query: opts.query,
            topic: opts.topic,
            client_filter: opts.client_filter,
            score_answer: 'false',
            score_text_passage: 'true',
            from: opts.from,
        })}`;
        indexModule.search(mockedContext, opts);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: url,
            method: 'get',
            reason: 'failed to get search',
        });
    });
});
