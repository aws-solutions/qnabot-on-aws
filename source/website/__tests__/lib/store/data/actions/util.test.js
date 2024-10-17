/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const util = require('../../../../../js/lib/store/data/actions/util');

describe('util data action', () => {
    const mockedContext = {
        dispatch: jest.fn(),
        commit: jest.fn(),
        handle: util.handle,
        load: util.load,
        state: {
            QAs: [
                {
                    questions: [
                        { text: 'question 1' },
                        { text: 'question 2' },
                    ],
                    answer: {
                        text: 'test answer',
                    },
                    card: {
                        text: '{ "key": "value" }',
                    },
                    qid: {
                        text: '1',
                    },
                },
            ],
        },
    };

    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'log').mockImplementation(jest.fn());
    });

    test('dispatch', () => {
        const mockedName = 'list';
        util.api(mockedContext, mockedName, {});
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith(`api/${mockedName}`, {}, { root: true });
    });

    test('parse', () => {
        const item = {
            _score: 1,
            select: true,
        };
        const expectedItem = {
            _score: 1,
            q: [],
            t: '',
            r: {
                title: '',
                text: '',
                url: '',
            },
            select: true,
        };
        const result = util.parse(item);
        expect(result).toEqual(expectedItem);
    });

    test('handle', () => {
        const testReason = 'test error';
        const handleFunction = mockedContext.handle(testReason);
        expect(handleFunction('some error')).rejects.toEqual(testReason);
        expect(mockedContext.commit).toHaveBeenCalledTimes(1);
        expect(mockedContext.commit).toHaveBeenCalledWith('setError', testReason, { root: true });
    });

    test('load without qa', async () => {
        const expectedError = new Error('Failed to load');
        const inputList = [
            'item 1',
            'item 2',
        ];
        jest.spyOn(Promise, 'resolve').mockResolvedValueOnce({});
        await expect(mockedContext.load(inputList)).rejects.toEqual(expectedError);
    });
});
