/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const rebuildModule = require('../../../js/components/designer/rebuild.vue');
import { shallowMount } from '@vue/test-utils';

describe('designer rebuild module', () => {
    test('mounted', () => {
        const wrapper = shallowMount(rebuildModule);
        expect(wrapper.exists()).toBe(true);
    });

    test('computed properties', () => {
        const store = {
            state: {
                bot: {
                    status: 'not ready',
                    build: {
                        message: 'test-message',
                    },
                },
            },
        };
        const wrapper = shallowMount(rebuildModule, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        expect(wrapper.vm.message).toEqual('test-message');
        expect(wrapper.vm.status).toEqual('not ready');
    });

    test('build & cancel mthods', () => {
        const store = {
            dispatch: jest.fn().mockImplementation(() => Promise.resolve({})),
        };
        const wrapper = shallowMount(rebuildModule, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        wrapper.vm.build();
        wrapper.vm.cancel();
        expect(store.dispatch).toHaveBeenCalledTimes(1);
        expect(store.dispatch).toHaveBeenCalledWith('data/build');
    });
});
