/*********************************************************************************************************************
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
 *********************************************************************************************************************/
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
