/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

const menuTestModule = await import('../../../js/components/designer/menu-test.vue');

describe('designer menu test module', () => {
    test('mounted', () => {
        const store = {
            dispatch: vi.fn(),
        };
        const wrapper = shallowMount(menuTestModule.default, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });
        expect(wrapper.exists()).toBe(true);
    });

    test('simulate', () => {
        const store = {
            dispatch: vi.fn(),
        };
        const wrapper = shallowMount(menuTestModule.default, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });
        wrapper.vm.simulate();
        expect(store.dispatch).toHaveBeenCalledWith('data/search', {
            client_filter: '',
            query: '',
            score_answer: undefined,
            score_on: 'qna item questions',
            topic: '',
        });
    });
});
