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
import routerModule from '../../js/lib/router';

jest.mock('vue-router', () => ({
    createWebHistory: jest.fn(),
    createWebHashHistory: jest.fn(),
}));

const defaultModuleMock = () => ({
    default: {},
});

jest.mock('../../js/components/hooks/index.vue', () => defaultModuleMock());

describe('js lib router module', () => {
    test('routes exist', () => {
        expect(routerModule.routes).toBeDefined();
        expect(routerModule.routes.length).toBeGreaterThan(0);
    });
});
