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
