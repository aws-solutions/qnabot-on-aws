/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const indexModule = require('../../../../js/lib/store/user/index');

describe('user index module', () => {
    test('it exists', () => {
        expect(indexModule).toBeDefined();
        expect(indexModule.actions).toBeDefined();
        expect(indexModule.mutations).toBeDefined();
        expect(indexModule.state).toBeDefined();
        expect(indexModule.getters).toBeDefined();
        expect(indexModule.namespaced).toBeTruthy();
        expect(indexModule.state.loggedin).not.toBeTruthy();
    });
});
