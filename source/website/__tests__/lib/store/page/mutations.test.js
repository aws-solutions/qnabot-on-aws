/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const mutations = require('../../../../js/lib/store/page/mutations');

describe('mutations page test', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    test('setMode', () => {
        const store = {
            mode: '',
        };
        const newMode = 'test';
        mutations.setMode(store, newMode);
        expect(store.mode).toEqual(newMode);
    });

    test('setPage', () => {
        const store = {
            current: 3,
        };
        const newPage = 7;
        mutations.setPage(store, newPage);
        expect(store.current).toEqual(newPage);
    });

    test('setTotal', () => {
        const store = {
            total: 6,
        };
        const newTotal = 7;
        mutations.setTotal(store, newTotal);
        expect(store.total).toEqual(newTotal);
    });

    test('incrementTotal by 1', () => {
        const store = {
            page: 6,
        };
        const expectedResult = store.page + 1;
        mutations.incrementTotal(store);
        expect(store.page).toEqual(expectedResult);
    });

    test('incrementTotal by x', () => {
        const store = {
            page: 6,
        };
        const expectedResult = store.page + 3;
        mutations.incrementTotal(store, 3);
        expect(store.page).toEqual(expectedResult);
    });

    test('decrementTotal by 1', () => {
        const store = {
            page: 6,
        };
        const expectedResult = store.page - 1;
        mutations.decrementTotal(store);
        expect(store.page).toEqual(expectedResult);
    });

    test('decrementTotal by x', () => {
        const store = {
            page: 6,
        };
        const expectedResult = store.page - 2;
        mutations.decrementTotal(store, 2);
        expect(store.page).toEqual(expectedResult);
    });

    test('toggleMode filter mode', () => {
        const mode = 'filter';
        const store = {
            mode: {
                filter: {
                    on: false,
                },
                other: true,
                someBooleanKey: true,
            },
        };

        mutations.toggleMode(store, mode);
        expect(store.mode.filter.on).toBe(true);
        expect(store.mode.someBooleanKey).toBe(false);
        expect(store.mode.other).toBe(false);
    });

    test('toggleMode other mode', () => {
        const mode = 'other';
        const store = {
            mode: {
                filter: {
                    on: true,
                },
                other: false,
                someBooleanKey: true,
            },
        };

        mutations.toggleMode(store, mode);
        expect(store.mode.filter.on).toBe(false);
        expect(store.mode.someBooleanKey).toBe(false);
        expect(store.mode.other).toBe(true);
    });

    test('toggleSearch', () => {
        const store = {
            mode: {
                search: false,
            },
        };
        mutations.toggleSearch(store);
        expect(store.mode.search).toBe(true);
    });

    test('toggleFilter', () => {
        const store = {
            mode: {
                filter: false,
            },
        };
        mutations.toggleFilter(store);
        expect(store.mode.filter).toBe(true);
    });
});
