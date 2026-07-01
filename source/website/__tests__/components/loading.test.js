/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import LoadingComponent from '../../js/components/loading.vue';

describe('loading.vue', () => {
    const createWrapper = () => {
        const mockStore = {
            dispatch: vi.fn().mockResolvedValue({}),
        };
        
        const mockRouter = {
            replace: vi.fn(),
        };

        return shallowMount(LoadingComponent, {
            global: {
                mocks: {
                    $store: mockStore,
                    $router: mockRouter,
                },
            },
        });
    };

    test('renders loading component', () => {
        const wrapper = createWrapper();
        expect(wrapper.exists()).toBe(true);
    });

    test('dispatches bootstrap and login on creation', async () => {
        const wrapper = createWrapper();
        
        await wrapper.vm.$nextTick();
        
        expect(wrapper.vm.$store.dispatch).toHaveBeenCalledWith('bootstrap');
        expect(wrapper.vm.$store.dispatch).toHaveBeenCalledWith('user/login');
    });

    test('redirects to edit page after login', async () => {
        const wrapper = createWrapper();
        
        await wrapper.vm.$nextTick();
        await new Promise(resolve => setTimeout(resolve, 10));
        
        expect(wrapper.vm.$router.replace).toHaveBeenCalledWith('/edit');
    });

    test('component has correct structure', () => {
        const wrapper = createWrapper();
        expect(wrapper.vm).toBeDefined();
    });
});
