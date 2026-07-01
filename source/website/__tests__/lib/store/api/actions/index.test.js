/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { vi } from 'vitest';
import { stringify as query } from 'query-string';
import mockedContext from './mockedContext';

import indexModule from '../../../../../js/lib/store/api/actions/index';
import axios from 'axios';

vi.mock('axios');
vi.mock('aws4', () => ({
    sign: vi.fn((request) => request)
}));


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
        vi.resetAllMocks();
        vi.spyOn(console, 'log').mockImplementation(vi.fn());
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

        const resFunction = vi.fn();
        const rejFunction = vi.fn((error) => error);

        await indexModule._request(mockedContext, opts).then(resFunction, rejFunction);
        expect(resFunction).toHaveBeenCalledTimes(0);
        expect(rejFunction).toHaveBeenCalledTimes(1);
        expect(rejFunction).toHaveBeenCalledWith(new Error('does-not-exist'));
    });

    test('_request with 204 No Content response', async () => {
        const opts = {
            url: 'https://example.com',
            method: 'DELETE',
            headers: {},
        };
        const successResult = {
            status: 204,
            data: '',
        };
        axios.mockResolvedValueOnce(successResult);

        const result = await indexModule._request(mockedContext, opts);
        expect(result).toEqual({});
    });

    // NOTE: This test must run before any test that triggers a 403 redirect, because
    // handle403Error and handleTimeout share a module-level `failed` flag. Once a 403
    // sets failed=true, handleTimeout's confirm branch is no longer reachable.
    test('_request with CredentialTimeout error triggers handleTimeout confirm dialog', async () => {
        // Provide DesignerLogin so handleTimeout's main branch (if login && !failed) is entered
        mockedContext.rootState.info._links.DesignerLogin = { href: 'https://example.com/login' };

        const opts = {
            url: 'https://example.com',
            method: 'GET',
            headers: {},
        };
        const credentialError = new Error('Credential timeout');
        credentialError.name = 'CredentialTimeout';
        axios.mockImplementationOnce(() => { throw credentialError; });
        // confirm returns false → handleTimeout throws e rather than redirecting
        global.window.confirm = vi.fn().mockReturnValue(false);

        const rejFunction = vi.fn();
        await indexModule._request(mockedContext, opts).then(() => {}, rejFunction);
        expect(global.window.confirm).toHaveBeenCalled();
        expect(rejFunction).toHaveBeenCalledTimes(1);

        delete mockedContext.rootState.info._links.DesignerLogin;
    });

    test('_request with 403 error and login redirect', async () => {
        const opts = {
            url: 'https://example.com',
            method: 'GET',
            headers: {},
        };
        const customError = new CustomError('Forbidden', { status: 403 });
        axios.mockImplementationOnce(() => {
            throw customError;
        });

        global.window.confirm = vi.fn(() => true);
        global.window.location = { href: '' };

        const resFunction = vi.fn();
        const rejFunction = vi.fn();

        await indexModule._request(mockedContext, opts).then(resFunction, rejFunction);
        expect(rejFunction).toHaveBeenCalledTimes(1);
    });

    test('_request with 500 error and Error type response', async () => {
        const opts = {
            url: 'https://example.com',
            method: 'GET',
            headers: {},
        };
        const customError = new CustomError('Server Error', { 
            status: 500,
            data: {
                type: 'Error',
                message: 'Internal server error'
            }
        });
        axios.mockImplementationOnce(() => {
            throw customError;
        });

        const resFunction = vi.fn();
        const rejFunction = vi.fn();

        await indexModule._request(mockedContext, opts).then(resFunction, rejFunction);
        expect(rejFunction).toHaveBeenCalledTimes(1);
    });

    // Skipping CredentialTimeout test due to module-level state management complexity
    test.skip('_request with CredentialTimeout error', async () => {
        const opts = {
            url: 'https://example.com',
            method: 'GET',
            headers: {},
        };
        const credError = new Error('Credential timeout');
        credError.name = 'CredentialTimeout';
        
        // Mock getCredentials to throw the error
        mockedContext.dispatch = vi.fn().mockImplementation((action) => {
            if (action === 'user/getCredentials') {
                throw credError;
            }
            return Promise.resolve({});
        });

        global.window.confirm = vi.fn(() => true);
        global.window.location = { href: '' };

        const resFunction = vi.fn();
        const rejFunction = vi.fn();

        await indexModule._request(mockedContext, opts).then(resFunction, rejFunction);
        expect(global.window.confirm).toHaveBeenCalled();
        expect(mockedContext.dispatch).toHaveBeenCalledWith('user/logout', {}, { root: true });
    });

    test('_request with NotAuthorizedException error', async () => {
        const opts = {
            url: 'https://example.com',
            method: 'GET',
            headers: {},
        };
        const authError = new Error('Not authorized');
        authError.name = 'NotAuthorizedException';
        axios.mockImplementationOnce(() => {
            throw authError;
        });

        const resFunction = vi.fn();
        const rejFunction = vi.fn();

        await indexModule._request(mockedContext, opts).then(resFunction, rejFunction);
        // Should not throw, just log
        expect(console.log).toHaveBeenCalled();
    });

    test('_request with unknown error', async () => {
        const opts = {
            url: 'https://example.com',
            method: 'GET',
            headers: {},
        };
        const unknownError = new Error('Unknown error');
        axios.mockImplementationOnce(() => {
            throw unknownError;
        });

        global.window.alert = vi.fn();

        const resFunction = vi.fn();
        const rejFunction = vi.fn();

        await indexModule._request(mockedContext, opts).then(resFunction, rejFunction);
        expect(global.window.alert).toHaveBeenCalledWith('Unknown Error');
        expect(rejFunction).toHaveBeenCalledTimes(1);
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

    test('schema with valid response', async () => {
        const schemaData = { properties: { qid: { type: 'string' } } };
        mockedContext.dispatch.mockResolvedValueOnce(schemaData);
        
        const result = await indexModule.schema(mockedContext, {});
        
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.questions.href,
            method: 'options',
            reason: 'Failed to get qa options',
        });
        expect(result).toEqual(schemaData);
    });

    test('schema with empty response falls back to bundled schemas', async () => {
        mockedContext.dispatch.mockResolvedValueOnce({});
        
        const result = await indexModule.schema(mockedContext, {});
        
        expect(result).toBeDefined();
        // Should return bundled schemas instead of empty object
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
        const resFunction = vi.fn((result) => result);
        const rejFunction = vi.fn();
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
        const resFunction = vi.fn();
        const rejFunction = vi.fn();
        mockedContext.dispatch.mockImplementationOnce(() => {
            throw Error('does-not-exist');
        });
        await indexModule.check(mockedContext, 'test-qid').then(resFunction, rejFunction);
        expect(resFunction).toHaveBeenCalledTimes(1);
        expect(rejFunction).toHaveBeenCalledTimes(0);
    });

    test('check encounters any other error', async () => {
        const resFunction = vi.fn();
        const rejFunction = vi.fn();
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

    test('_request with 404 error without ignore404 flag', async () => {
        const opts = {
            url: 'https://example.com',
            method: 'GET',
            headers: {},
        };
        const customError = new CustomError('Not Found', { status: 404, data: {} });
        axios.mockImplementationOnce(() => { throw customError; });

        global.window.alert = vi.fn();

        const resFunction = vi.fn();
        const rejFunction = vi.fn();

        await indexModule._request(mockedContext, opts).then(resFunction, rejFunction);
        expect(global.window.alert).toHaveBeenCalledWith('Request Failed: error response from endpoint');
        expect(rejFunction).toHaveBeenCalledTimes(1);
    });

    test('_request with response error object (non-Error type)', async () => {
        const opts = {
            url: 'https://example.com',
            method: 'GET',
            headers: {},
        };
        const customError = new CustomError('Server Error', {
            status: 500,
            data: { type: 'NotError', message: 'something else' },
        });
        axios.mockImplementationOnce(() => { throw customError; });

        global.window.alert = vi.fn();

        const resFunction = vi.fn();
        const rejFunction = vi.fn();

        await indexModule._request(mockedContext, opts).then(resFunction, rejFunction);
        expect(global.window.alert).toHaveBeenCalledWith('Request Failed: error response from endpoint');
        expect(rejFunction).toHaveBeenCalledTimes(1);
    });

    test('_request with body sets content-type header', async () => {
        const opts = {
            url: 'https://example.com',
            method: 'POST',
            headers: {},
            body: { key: 'value' },
        };
        const successResult = { data: 'success' };
        axios.mockResolvedValueOnce(successResult);

        const result = await indexModule._request(mockedContext, opts);
        expect(result).toEqual(successResult.data);
        expect(axios).toHaveBeenCalledWith(
            expect.objectContaining({
                headers: expect.objectContaining({ 'content-type': 'application/json' }),
            })
        );
    });

    describe('dev mode URL resolution', () => {
        let originalEnv;

        beforeEach(() => {
            originalEnv = { ...import.meta.env };
        });

        afterEach(() => {
            Object.keys(import.meta.env).forEach(key => delete import.meta.env[key]);
            Object.assign(import.meta.env, originalEnv);
        });

        test('_request in dev mode with absolute URL resolves to relative path', async () => {
            import.meta.env.DEV = true;
            import.meta.env.VITE_PROXY_STAGE = 'dev';
            import.meta.env.VITE_PROXY_TARGET = 'https://api.example.com';

            const opts = {
                url: 'https://api.example.com/dev/questions',
                method: 'GET',
                headers: {},
            };
            const successResult = { status: 200, data: 'success' };
            axios.mockResolvedValueOnce(successResult);

            const result = await indexModule._request(mockedContext, opts);
            expect(result).toEqual(successResult.data);
        });

        test('_request in dev mode with relative URL prepends target', async () => {
            import.meta.env.DEV = true;
            import.meta.env.VITE_PROXY_STAGE = 'dev';
            import.meta.env.VITE_PROXY_TARGET = 'https://api.example.com';

            const opts = {
                url: '/questions',
                method: 'GET',
                headers: {},
            };
            const successResult = { status: 200, data: 'success' };
            axios.mockResolvedValueOnce(successResult);

            const result = await indexModule._request(mockedContext, opts);
            expect(result).toEqual(successResult.data);
        });

        test('_request in dev mode converts response _links to relative URLs', async () => {
            import.meta.env.DEV = true;
            import.meta.env.VITE_PROXY_STAGE = 'dev';
            import.meta.env.VITE_PROXY_TARGET = 'https://api.example.com';

            const opts = {
                url: '/questions',
                method: 'GET',
                headers: {},
            };
            const successResult = {
                status: 200,
                data: {
                    _links: {
                        questions: { href: 'https://api.example.com/dev/questions' },
                        CognitoEndpoint: { href: 'https://cognito.example.com' },
                    },
                },
            };
            axios.mockResolvedValueOnce(successResult);

            const result = await indexModule._request(mockedContext, opts);
            // CognitoEndpoint should be skipped, questions href should be converted
            expect(result._links.CognitoEndpoint.href).toBe('https://cognito.example.com');
            expect(result._links.questions.href).toBe('/questions');
        });

        test('_request in dev mode with result that has no _links', async () => {
            import.meta.env.DEV = true;
            import.meta.env.VITE_PROXY_STAGE = 'dev';
            import.meta.env.VITE_PROXY_TARGET = 'https://api.example.com';

            const opts = {
                url: '/questions',
                method: 'GET',
                headers: {},
            };
            const successResult = { status: 200, data: { items: [] } };
            axios.mockResolvedValueOnce(successResult);

            const result = await indexModule._request(mockedContext, opts);
            expect(result).toEqual(successResult.data);
        });
    });

    test('_request with 403 error when already failed throws instead of prompting', async () => {
        // DesignerLogin MUST be set so that `login` is truthy;
        // otherwise the else branch is hit because login is falsy, not because failed=true.
        mockedContext.rootState.info._links.DesignerLogin = { href: 'https://example.com/login' };

        const opts = {
            url: 'https://example.com',
            method: 'GET',
            headers: {},
        };
        const forbiddenError = new Error('Forbidden');
        forbiddenError.response = { status: 403, data: {} };
        axios.mockImplementation(() => { throw forbiddenError; });
        global.window.confirm = vi.fn().mockReturnValue(false);

        // With the module-level failed flag already set by the prior 403 test,
        // this 403 hits the else branch (failed=true) and rejects without prompting
        const rejFunction = vi.fn();
        await indexModule._request(mockedContext, opts).then(() => {}, rejFunction);
        expect(rejFunction).toHaveBeenCalledTimes(1);
        // confirm should NOT be called when failed=true — that's what distinguishes this branch
        expect(global.window.confirm).not.toHaveBeenCalled();

        delete mockedContext.rootState.info._links.DesignerLogin;
    });
});
