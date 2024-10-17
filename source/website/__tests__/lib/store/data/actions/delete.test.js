/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const deleteModule = require('../../../../../js/lib/store/data/actions/delete');
const util = require('../../../../../js/lib/store/data/actions//util');

jest.mock('../../../../../js/lib/store/data/actions//util');

describe('delete data action', () => {
    const mockedContext = {
        dispatch: jest.fn(),
        commit: jest.fn(),
        state: {
            QAs: [
                { qid: 'the-one-you-want' },
                { qid: 'not-the-one-you-want' },
                { qid: 'remove-in-bulk' },
                { qid: 'also-remove-in-bulk' },
            ],
            filter: 'test-filter',
        },
    };

    const mockItem = {
        questions: [
            'First question',
            'Second question',
            'Third question',
        ],
    };

    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'log').mockImplementation(jest.fn());
    });

    test('removeQ success', async () => {
        await deleteModule.removeQ(mockedContext, { index: 1, item: mockItem });
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('update', {
            qa: {
                questions: [
                    'First question',
                    'Third question',
                ],
            }
        });
    });

    test('removeQ failure', async () => {
        const resFunction = jest.fn();
        const rejFunction = jest.fn().mockImplementationOnce((err) => err.message);
        const expectedError = new Error('Failed to remove');
        mockedContext.dispatch.mockImplementationOnce(() => {
            throw new Error('Error');
        });
        await expect(deleteModule.removeQ(mockedContext, { index: 1, item: mockItem }).then(resFunction, rejFunction))
            .resolves.toBe(expectedError.message);
    });

    test('removeQA succcess', async () => {
        const qa = { qid: 'the-one-you-want' };
        await deleteModule.removeQA(mockedContext, qa);
        expect(util.api).toHaveBeenCalledTimes(1);
        expect(util.api).toHaveBeenCalledWith(mockedContext, 'remove', qa.qid);
    });

    test('removeQA throws error', async () => {
        const qa = { qid: 'the-one-you-want' };
        util.api.mockImplementationOnce(() => {
            throw new Error('test error');
        });
        await deleteModule.removeQA(mockedContext, qa);
        expect(util.api).toHaveBeenCalledTimes(1);
        expect(util.api).toHaveBeenCalledWith(mockedContext, 'remove', qa.qid);
        expect(mockedContext.commit).toHaveBeenCalledTimes(0);
    });

    test('removeQAs success', async () => {
        const qas = [
            { qid: 'remove-in-bulk' },
            { qid: 'also-remove-in-bulk' },
        ];
        await deleteModule.removeQAs(mockedContext, qas);
        expect(util.api).toHaveBeenCalledTimes(1);
        expect(util.api).toHaveBeenCalledWith(mockedContext, 'removeBulk', [
            'remove-in-bulk',
            'also-remove-in-bulk',
        ]);
        expect(mockedContext.commit).toHaveBeenCalledTimes(1);
        expect(mockedContext.commit).toHaveBeenCalledWith('page/decrementTotal', qas.length, { root: true });
    });

    test('removeQAs failure', async () => {
        const qas = [
            { qid: 'remove-in-bulk' },
            { qid: 'also-remove-in-bulk' },
        ];
        util.api.mockImplementationOnce(() => {
            throw new Error('test error');
        });
        await deleteModule.removeQAs(mockedContext, qas);
        expect(util.api).toHaveBeenCalledTimes(1);
        expect(util.api).toHaveBeenCalledWith(mockedContext, 'removeBulk', [
            'remove-in-bulk',
            'also-remove-in-bulk',
        ]);
        expect(mockedContext.commit).toHaveBeenCalledTimes(0);
    });

    test('removeFilter with filter', async () => {
        await deleteModule.removeFilter(mockedContext);
        expect(util.api).toHaveBeenCalledTimes(1);
        expect(util.api).toHaveBeenCalledWith(mockedContext, 'removeQuery', `${mockedContext.state.filter}.*`);
        expect(mockedContext.commit).toHaveBeenCalledTimes(2);
        expect(mockedContext.commit).toHaveBeenCalledWith('clearQA');
        expect(mockedContext.commit).toHaveBeenCalledWith('clearFilter');
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('get', {});
    });

    test('removeFilter without filter', async () => {
        const originalFilter = mockedContext.state.filter;
        mockedContext.state.filter = '';
        await deleteModule.removeFilter(mockedContext);
        mockedContext.state.filter = originalFilter;
        expect(util.api).toHaveBeenCalledTimes(1);
        expect(util.api).toHaveBeenCalledWith(mockedContext, 'removeQuery', '.*');
        expect(mockedContext.commit).toHaveBeenCalledTimes(2);
        expect(mockedContext.commit).toHaveBeenCalledWith('clearQA');
        expect(mockedContext.commit).toHaveBeenCalledWith('clearFilter');
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('get', {});
    });

    test('removeFilter throws an error', async () => {
        const resFunction = jest.fn();
        const rejFunction = jest.fn().mockImplementationOnce((err) => err.message);
        const expectedError = new Error('Failed to remove');
        util.api.mockImplementationOnce(() => {
            throw new Error('test error');
        });
        await expect(deleteModule.removeFilter(mockedContext).then(resFunction, rejFunction))
            .resolves.toBe(expectedError.message);
        expect(util.api).toHaveBeenCalledTimes(1);
        expect(util.api).toHaveBeenCalledWith(mockedContext, 'removeQuery', `${mockedContext.state.filter}.*`);
    });
});
