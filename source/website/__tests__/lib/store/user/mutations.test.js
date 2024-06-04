/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */
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
