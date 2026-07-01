/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { vi } from 'vitest';
import { describe, test, expect } from 'vitest';
import indexModule from '../../../js/components/genesys/index.vue';
import { shallowMount } from '@vue/test-utils';

describe('genesys component index', () => {
    test('mounted', () => {
        const store = {
            dispatch: vi.fn().mockImplementation(() => Promise.resolve({})),
        };
        const wrapper = shallowMount(indexModule, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });
        expect(wrapper.exists()).toBe(true);
    });

    test('copy method', async () => {
        global.URL.createObjectURL = vi.fn();
        global.URL.revokeObjectURL = vi.fn();
        const store = {
            dispatch: vi.fn().mockImplementation(() => Promise.resolve('test')),
        };
        const wrapper = shallowMount(indexModule, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });
        const btn = {
            loading: false,
        };

        await wrapper.vm.copy(btn);
        expect(store.dispatch).toHaveBeenCalledWith('api/getGenesysCallFlow');
    });
});
