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
import displayModule from '../../../js/components/designer/display.vue';
import { shallowMount } from '@vue/test-utils';

describe('display vue', () => {
    test('mounted', () => {
        const wrapper = shallowMount(displayModule);
        expect(wrapper.exists()).toBeTruthy();
    });

    test('empty array', () => {
        const wrapper = shallowMount(displayModule, {
            props: {
                schema: {
                    type: 'array',
                },
                modelValue: [],
            },
        });
        expect(wrapper.vm.empty).toBe(true);
    });

    test('empty array', () => {
        const wrapper = shallowMount(displayModule, {
            props: {
                schema: {
                    type: 'array',
                },
                modelValue: [],
            },
        });
        expect(wrapper.vm.empty).toBe(true);
    });

    test('empty object', () => {
        const wrapper = shallowMount(displayModule, {
            props: {
                schema: {
                    type: 'object',
                },
                modelValue: [],
            },
        });
        expect(wrapper.vm.empty).toBe(true);
    });

    test('empty truthy', () => {
        const wrapper = shallowMount(displayModule, {
            props: {
                schema: {
                    type: 'boolean',
                },
                modelValue: false,
            },
        });
        expect(wrapper.vm.empty).toBe(true);
    });

    test('properties', () => {
        const schema = {
            type: 'object',
            properties: {
                key: {},
            },
        };

        const modelValue = {
            key: 'value',
        };

        const expectedResult = [{ name: 'key' }];

        const wrapper = shallowMount(displayModule, {
            props: {
                schema,
                modelValue,
            },
        });

        const result = wrapper.vm.properties;
        expect(result).toEqual(expectedResult);
    });
});
