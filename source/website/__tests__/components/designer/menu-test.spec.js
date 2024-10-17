/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const menuTestModule = require('../../../js/components/designer/menu-test.vue');
import { shallowMount } from '@vue/test-utils';

describe('designer menu test module', () => {
    test('mounted', () => {
        const store = {
            dispatch: jest.fn(),
        };
        const wrapper = shallowMount(menuTestModule, {
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
            dispatch: jest.fn(),
        };
        const wrapper = shallowMount(menuTestModule, {
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
