/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const gettersModule = require('../../../../js/lib/store/page/getters');

describe('getters page test', () => {
    test('pages', () => {
        const state = {
            total: 10,
            perpage: 5,
        }
        const expectedPages = 2;
        expect(gettersModule.pages(state)).toEqual(expectedPages);
    });
});
