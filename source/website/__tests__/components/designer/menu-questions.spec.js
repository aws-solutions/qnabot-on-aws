/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const menuQuestionsModule = require('../../../js/components/designer/menu-questions.vue');
import { shallowMount } from '@vue/test-utils'

describe('designer menu-questions module', () => {
    test('mounted', () => {
        const wrapper = shallowMount(menuQuestionsModule);
        expect(wrapper.exists()).toBe(true);
    });

    test('filter', () => {
        const wrapper = shallowMount(menuQuestionsModule);
        wrapper.vm.filter();
        expect(wrapper.emitted()).toBeTruthy();
    });

    test('refresh', () => {
        const wrapper = shallowMount(menuQuestionsModule);
        wrapper.vm.refresh();
        expect(wrapper.emitted('refresh')).toBeTruthy();
    });

    test('build', () => {
        const store = {
            dispatch: jest.fn().mockImplementation(() => Promise.resolve({})),
        }
        const wrapper = shallowMount(menuQuestionsModule, {
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
