/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
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
