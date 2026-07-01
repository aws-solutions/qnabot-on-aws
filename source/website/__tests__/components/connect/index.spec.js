/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect, vi } from 'vitest';
import connectModule from '../../../js/components/connect/index.vue';
import { shallowMount } from '@vue/test-utils';

describe('connect index component', () => {
    test('should mount', () => {
        const store = {
            state: {
                bot: {},
            },
        };
        const wrapper = shallowMount(connectModule, {
            global: {
                mocks: {
                    $store: store,
                }
            }
        });
        expect(wrapper.exists()).toBe(true);
    });

    test('copy method', async () => {
        global.URL.createObjectURL = vi.fn();
        global.URL.revokeObjectURL = vi.fn();
        const store = {
            state: {
                bot: {},
            },
            dispatch: vi.fn().mockImplementation(() => Promise.resolve('test')),
        };
        const wrapper = shallowMount(connectModule, {
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
        expect(store.dispatch).toHaveBeenCalledWith('api/getContactFlow');
    });
});
