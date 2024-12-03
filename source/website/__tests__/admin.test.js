/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
require('../js/admin');

const vueRouter = require('vue-router');

jest.mock('vuetify/iconsets/md', () => ({
    aliases: jest.fn(),
    md: jest.fn(),
}));

jest.mock('vuetify', () => ({
    createVuetify: jest.fn(),
}));

jest.mock('vuetify/components', () => {});

jest.mock('vuetify/directives', () => {});

jest.mock('vue-router', () => ({
    createRouter: jest.fn().mockReturnValue({
        replace: jest.fn(),
        isReady: jest.fn().mockReturnValue(Promise.resolve(false)),
    }),
}));

jest.mock('vuex-router-sync', () => ({
    sync: jest.fn(),
}));

jest.mock('../js/lib', () => ({
    router: {},
}));

describe('js admin module', () => {
    test('load', () => {
        expect(vueRouter.createRouter().replace).toHaveBeenCalledWith('/loading');
    });
});
