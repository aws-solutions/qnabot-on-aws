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
const inputModule = require('../../../js/components/designer/input.vue');
import { shallowMount } from '@vue/test-utils'

describe('designer input module', () => {

    const shallowMountWithDefaults = () => {
        const wrapper = shallowMount(inputModule, {
            props: {
                modelValue: [
                    { key: 'value1' },
                    { key: 'value2' },
                ],
                required: true,
                index: '1',
                name: 'test-name',
                schema: {
                    type: 'object',
                    items: { type: 'object', key: 'value3' },
                },
                path: 'qna.test-name[1]',
            },
        });
        return wrapper;
    };

    test('mounted', () => {
        const wrapper = shallowMount(inputModule);
        expect(wrapper.exists()).toBe(true);
    });

    test('computed properties', () => {
        const wrapper = shallowMountWithDefaults();
        wrapper.vm.$data.schema = {
            maxLength: 10,
            title: 'Books',
            properties: {
                key: {},
            },
        };

        expect(wrapper.vm.singularTitle).toEqual('Book');
        expect(wrapper.vm.properties).toEqual([]);
        expect(wrapper.vm.validate).toEqual('required|max:10');
        expect(wrapper.vm.id).toEqual('qna-test-name-1');
    });

    test('remove method', () => {
        const wrapper = shallowMountWithDefaults();
        wrapper.vm.remove();
        expect(wrapper.vm.modelValue).toEqual([{ key: 'value2' }]);
    });

    test('add method', () => {
        const wrapper = shallowMountWithDefaults();
        wrapper.vm.add();
        expect(wrapper.vm.modelValue).toEqual([
            { key: 'value1' },
            { key: 'value2' },
            {},
        ]);
    });

    test('reset method', () => {
        const wrapper = shallowMountWithDefaults();
        wrapper.vm.reset();
        expect(wrapper.vm.$data.local).toEqual({});
    });

    test('ifRequired method', () => {
        const wrapper = shallowMountWithDefaults();
        expect(wrapper.vm.ifRequired()).toEqual(false);
    });

    test('isValid method', () => {
        const wrapper = shallowMountWithDefaults();
        wrapper.vm.isValid(true)
        expect(wrapper.vm.$data.valid).toEqual(true);
    });

    test('setValid method', () => {
        const wrapper = shallowMountWithDefaults();
        wrapper.vm.setValid(true);
        expect(wrapper.vm.$data.valid).toEqual(false);
    });
});
