/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const mutationsModule = require('../../../../js/lib/store/user/mutations');
const { set } = require('vue');

jest.mock('vue');

describe('user mutations', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    test('credentials', () => {
        const mockedState = {
            loggedin: false,
            creddentials: {},
        };
        const payload = {
            key: 'value',
        };
        mutationsModule.credentials(mockedState, payload);
        expect(mockedState.credentials).toEqual(payload);
        expect(mockedState.loggedin).toBe(true);
    });

    test('login', () => {
        const mockedState = {
            loggedIn: false,
        };
        mutationsModule.login(mockedState);
        expect(mockedState.loggedIn).toBe(true);
    });

    test('setId', () => {
        const mockedState = {
            Id: '',
        };
        const newId = 'newId';
        mutationsModule.setId(mockedState, newId);
        expect(mockedState.Id).toBe(newId);
    });
});
