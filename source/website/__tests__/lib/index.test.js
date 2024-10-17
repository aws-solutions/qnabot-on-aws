/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const indexModule = require('../../js/lib/index');

jest.mock('../../js/lib/router', () => {});
jest.mock('../../js/lib/store', () => {});

describe('lib js index module', () => {
    test('it exists', () => {
        expect(indexModule).toBeDefined();
    });
});
