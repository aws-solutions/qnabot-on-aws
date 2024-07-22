/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/
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
