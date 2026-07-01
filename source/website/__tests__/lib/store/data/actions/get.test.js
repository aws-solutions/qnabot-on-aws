
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { vi, beforeEach, describe, test, expect } from 'vitest';
import getModule from '../../../../../js/lib/store/data/actions/get';
import util from '../../../../../js/lib/store/data/actions/util';


vi.mock('../../../../../js/lib/store/data/actions/util');

describe('get data action', () => {
    const mockedContext = {
        commit: vi.fn(),
        dispatch: vi.fn(),
        state: {
            filter: '.*',
            QAs: []
        }
    };

    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(console, 'log').mockImplementation(vi.fn());
        vi.spyOn(console, 'error').mockImplementation(vi.fn());
        mockedContext.state.QAs = [];
        mockedContext.state.filter = '.*';
    });

    test('schema success', async () => {
        const mockSchema = { type: 'object', properties: {} };
        util.api.mockResolvedValueOnce(mockSchema);
        await getModule.schema(mockedContext);
        expect(util.api).toHaveBeenCalledTimes(1);
        expect(util.api).toHaveBeenCalledWith(mockedContext, 'schema');
        expect(mockedContext.commit).toHaveBeenCalledTimes(1);
        expect(mockedContext.commit).toHaveBeenCalledWith('schema', mockSchema);
    });

    test('schema failure', async () => {
        const mockError = new Error('Schema fetch failed');
        util.api.mockRejectedValueOnce(mockError);
        await expect(getModule.schema(mockedContext)).rejects.toThrow('Schema fetch failed');
        expect(console.error).toHaveBeenCalled();
    });

    test('botinfo success', async () => {
        const mockValue = { value: 'test-bot' };
        util.api.mockResolvedValue(mockValue);
        await getModule.botinfo(mockedContext);
        expect(util.api).toHaveBeenCalledTimes(2);
        expect(util.api).toHaveBeenCalledWith(mockedContext, 'botinfo');
        expect(util.api).toHaveBeenCalledWith(mockedContext, 'alexa');
        expect(mockedContext.commit).toHaveBeenCalledTimes(2);
        expect(mockedContext.commit).toHaveBeenCalledWith('bot', mockValue, { root: true });
        expect(mockedContext.commit).toHaveBeenCalledWith('alexa', mockValue, { root: true });
    });

    test('botinfo failure', async () => {
        const resFunction = vi.fn();
        const rejFunction = vi.fn().mockImplementationOnce((err) => err.message);
        const expectedError = 'Failed get BotInfo';
        util.api.mockImplementationOnce(() => {
            throw new Error('test error');
        });
        await expect(getModule.botinfo(mockedContext).then(resFunction, rejFunction))
            .resolves.toBe(expectedError);
        expect(util.api).toHaveBeenCalledTimes(1);
        expect(mockedContext.commit).toHaveBeenCalledTimes(0);
    });

    test('search success', async () => {
        const mockResult = {
            qa: [{ qid: 'q1', q: ['test'], a: ['answer'] }],
            total: 1
        };
        util.api.mockResolvedValueOnce(mockResult);
        util.parse = vi.fn((x) => x);

        const opts = { query: 'test', topic: 'general', perpage: 10 };
        const result = await getModule.search(mockedContext, opts);

        expect(util.api).toHaveBeenCalledWith(mockedContext, 'search', opts);
        expect(mockedContext.commit).toHaveBeenCalledWith('clearQA');
        expect(mockedContext.commit).toHaveBeenCalledWith('page/setTotal', 1, { root: true });
        expect(result).toBe(1);
    });

    test('search failure', async () => {
        util.api.mockRejectedValueOnce(new Error('Search failed'));
        const opts = { query: 'test' };
        await expect(getModule.search(mockedContext, opts)).rejects.toThrow('Failed to search');
    });

    test('get success with defaults', async () => {
        const mockResult = {
            qa: [{ qid: 'q1' }, { qid: 'q2' }],
            total: 2
        };
        util.api.mockResolvedValueOnce(mockResult);
        util.parse = vi.fn((x) => x);

        const result = await getModule.get(mockedContext, {});

        expect(mockedContext.commit).toHaveBeenCalledWith('loading', 'primary');
        expect(util.api).toHaveBeenCalledWith(mockedContext, 'list', expect.objectContaining({
            filter: '.*',
            order: 'asc'
        }));
        expect(mockedContext.commit).toHaveBeenCalledWith('clearQA');
        expect(mockedContext.commit).toHaveBeenCalledWith('page/setTotal', 2, { root: true });
        expect(mockedContext.commit).toHaveBeenCalledWith('loading', false);
        expect(result).toBe(2);
    });

    test('get success with custom options', async () => {
        const mockResult = {
            qa: [{ qid: 'q1' }],
            total: 1
        };
        util.api.mockResolvedValueOnce(mockResult);
        util.parse = vi.fn((x) => x);

        const opts = { filter: 'custom.*', order: 'desc', perpage: 20, page: 1 };
        const result = await getModule.get(mockedContext, opts);

        expect(util.api).toHaveBeenCalledWith(mockedContext, 'list', opts);
        expect(result).toBe(1);
    });

    test('get failure', async () => {
        util.api.mockRejectedValueOnce(new Error('Get failed'));
        await expect(getModule.get(mockedContext, {})).rejects.toThrow('Failed to get');
        expect(mockedContext.commit).toHaveBeenCalledWith('loading', false);
    });

    test('getAll success', async () => {
        mockedContext.dispatch
            .mockResolvedValueOnce(1)
            .mockResolvedValueOnce(0);
        await getModule.getAll(mockedContext);
        expect(mockedContext.commit).toHaveBeenCalledTimes(1);
        expect(mockedContext.commit).toHaveBeenCalledWith('clearQA');
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(2);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('get', { page: 0 });
        expect(mockedContext.dispatch).toHaveBeenCalledWith('get', { page: 1 });
    });

    test('getAll failure', async () => {
        const mockedError = new Error('test error');
        mockedContext.commit.mockImplementationOnce(() => {
            throw mockedError;
        });
        await expect(getModule.getAll(mockedContext)).rejects.toBe(mockedError);
    });

    test('getAll handles dispatch error', async () => {
        mockedContext.dispatch.mockRejectedValueOnce(new Error('Dispatch failed'));
        await expect(getModule.getAll(mockedContext)).rejects.toThrow('Failed to getAll');
    });
});
