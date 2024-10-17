/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const mutationsModule = require('../../../../js/lib/store/data/mutations');

describe('mutations data', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    test('close success', () => {
        const testStore = {
            commit: jest.fn(),
            QAs: [
                {
                    open: true,
                    edit: true,
                    questions: [
                        { text: 'question 1', tmp: 'question 1' },
                        { text: 'question 2', tmp: 'question 2' },
                    ],
                    answer: {
                        text: 'test answer',
                        tmp: 'test answer',
                    },
                    card: {
                        imageUrl: {
                            text: 'https://example.com', tmp: 'https://example.com',
                        },
                        title: {
                            text: 'test-title', tmp: 'test-title',
                        },
                    },
                    qid: {
                        text: '1',
                        tmp: '1',
                    },
                },
            ],
        };

        expect(mutationsModule.close(testStore)).toBe(true);
        expect(testStore.QAs[0].open).toBe(false);
        expect(testStore.QAs[0].edit).toBe(false);
        expect(testStore.commit).toHaveBeenCalledTimes(0);
    });

    test('close fail', () => {
        const testStore = {
            commit: jest.fn(),
            QAs: [
                {
                    open: true,
                    edit: true,
                    questions: [
                        { text: 'question 1', tmp: 'some other value' },
                        { text: 'question 2', tmp: 'question 2' },
                    ],
                    answer: {
                        text: 'test answer',
                        tmp: 'test answer',
                    },
                    card: {
                        imageUrl: {
                            text: 'https://example.com', tmp: 'https://other-value.example.com',
                        },
                        title: {
                            text: 'test-title', tmp: 'test-title',
                        },
                    },
                    qid: {
                        text: '1',
                        tmp: '1',
                    },
                },
            ],
        };

        expect(mutationsModule.close(testStore)).toBe(false);
        expect(testStore.QAs[0].open).toBe(true);
        expect(testStore.QAs[0].edit).toBe(true);
        expect(testStore.commit).toHaveBeenCalledTimes(1);
        expect(testStore.commit).toHaveBeenCalledWith('setError', 'Please save or cancel your work', { root: true });
    });

    test('selectAll', () => {
        const testStore = {
            QAs: [
                { select: false },
                { select: true },
                { select: false },
            ],
        };

        mutationsModule.selectAll(testStore, true);
        expect(testStore.QAs.map((qa) => qa.select).includes(false)).toBe(false);
    });

    test('setFilter', () => {
        const testStore = {
            filter: '',
        };
        const filterText = 'test-filter';
        mutationsModule.setFilter(testStore, filterText);
        expect(testStore.filter).toEqual(filterText);
    });

    test('clearFilter', () => {
        const testStore = {
            filter: 'test-filter',
        };
        mutationsModule.clearFilter(testStore);
        expect(testStore.filter).toEqual(null);
    });

    test('schema', () => {
        const testState = {
            schema: '',
        };
        const testSchema = 'test-schema';
        mutationsModule.schema(testState, testSchema);
        expect(testState.schema).toEqual(testSchema);
    });

    test('delQA', () => {
        const testState = {
            QAs: [
                { qid: '1' },
                { qid: '2' },
                { qid: '3' },
            ],
        };
        const QaToDelete = {
            qid: '2',
        };
        mutationsModule.delQA(testState, QaToDelete);
        expect(testState.QAs.length).toBe(2);
        expect(testState.QAs.findIndex((qa) => qa.qid === QaToDelete.qid)).toBe(-1);
    });

    test('clearQA', () => {
        const testState = {
            QAs: [
                { qid: '1' },
                { qid: '2' },
                { qid: '3' },
            ],
        };
        mutationsModule.clearQA(testState);
        expect(testState.QAs.length).toBe(0);
    });

    test('results', () => {
        const testState = {
            results: 'test-result',
        };
        const newResult = 'new-result';
        mutationsModule.results(testState, newResult);
        expect(testState.results).toEqual(newResult);
    });
});
