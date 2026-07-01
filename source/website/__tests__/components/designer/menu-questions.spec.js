/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

const menuQuestionsModule = await import('../../../js/components/designer/menu-questions.vue');

describe('designer menu-questions module', () => {
    test('mounted', () => {
        const store = {
            state: {
                data: {
                    QAs: [],
                },
            },
        };
        const wrapper = shallowMount(menuQuestionsModule.default, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });
        expect(wrapper.exists()).toBe(true);
    });

    test('filter', () => {
        const store = {
            state: {
                data: {
                    QAs: [],
                },
            },
        };
        const wrapper = shallowMount(menuQuestionsModule.default, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });
        wrapper.vm.filter();
        expect(wrapper.emitted()).toBeTruthy();
    });

    test('refresh', () => {
        const store = {
            state: {
                data: {
                    QAs: [],
                },
            },
        };
        const wrapper = shallowMount(menuQuestionsModule.default, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });
        wrapper.vm.refresh();
        expect(wrapper.emitted('refresh')).toBeTruthy();
    });

    test('build', () => {
        const store = {
            state: {
                data: {
                    QAs: [],
                },
            },
            dispatch: vi.fn().mockImplementation(() => Promise.resolve({})),
        }
        const wrapper = shallowMount(menuQuestionsModule.default, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        wrapper.vm.build();
        expect(store.dispatch).toHaveBeenCalledTimes(1);
        expect(store.dispatch).toHaveBeenCalledWith('data/build');
    });
});
