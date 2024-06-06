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
