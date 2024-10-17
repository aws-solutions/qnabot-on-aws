/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import connectModule from '../../../js/components/connect/index.vue';
import { shallowMount } from '@vue/test-utils';

describe('connect index component', () => {
    test('should mount', () => {
        const wrapper = shallowMount(connectModule);
        expect(wrapper.exists()).toBe(true);
    });

    test('copy method', async () => {
        global.URL.createObjectURL = jest.fn();
        global.URL.revokeObjectURL = jest.fn();
        const store = {
            dispatch: jest.fn().mockImplementation(() => Promise.resolve('test')),
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
