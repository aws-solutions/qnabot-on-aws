/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
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
