/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

const rebuildModule = await import('../../../js/components/designer/rebuild.vue');

describe('designer rebuild module', () => {
    test('mounted', () => {
        const wrapper = shallowMount(rebuildModule.default);
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
        const wrapper = shallowMount(rebuildModule.default, {
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
            dispatch: vi.fn().mockImplementation(() => Promise.resolve({})),
        };
        const wrapper = shallowMount(rebuildModule.default, {
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
