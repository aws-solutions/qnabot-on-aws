/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
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

    describe('validation rules', () => {
        test('maxLength rule returns true when under limit', () => {
            const wrapper = shallowMountWithDefaults();
            wrapper.vm.$data.schema = { maxLength: 100 };
            const result = wrapper.vm.$data.rules.maxLength('short text');
            expect(result).toBe(true);
        });

        test('maxLength rule returns error string when over limit', () => {
            const wrapper = shallowMountWithDefaults();
            wrapper.vm.$data.schema = { maxLength: 10 };
            const longText = 'this is a very long text that exceeds the limit';
            const result = wrapper.vm.$data.rules.maxLength(longText);
            expect(result).toBe('Maximum 10 characters allowed');
        });

        test('maxLength rule returns true when no maxLength defined', () => {
            const wrapper = shallowMountWithDefaults();
            wrapper.vm.$data.schema = {};
            const result = wrapper.vm.$data.rules.maxLength('any text');
            expect(result).toBe(true);
        });

        test('maxLength rule returns true when value is empty', () => {
            const wrapper = shallowMountWithDefaults();
            wrapper.vm.$data.schema = { maxLength: 10 };
            const result = wrapper.vm.$data.rules.maxLength('');
            expect(result).toBe(true);
        });

        test('schema rule returns true when validation passes', () => {
            const wrapper = shallowMountWithDefaults();
            wrapper.vm.$data.schema = { type: 'string', maxLength: 100 };
            const result = wrapper.vm.$data.rules.schema('valid text');
            expect(result).toBe(true);
        });

        test('schema rule returns error string when maxLength exceeded', () => {
            const wrapper = shallowMountWithDefaults();
            wrapper.vm.$data.schema = { type: 'string', maxLength: 10 };
            const longText = 'this is a very long text that exceeds the limit';
            const result = wrapper.vm.$data.rules.schema(longText);
            expect(result).toContain('Maximum 10 characters allowed');
        });

        test('schema rule converts AJV errors to readable strings', () => {
            const wrapper = shallowMountWithDefaults();
            wrapper.vm.$data.schema = { type: 'string', maxLength: 5 };
            const result = wrapper.vm.$data.rules.schema('too long');
            expect(typeof result).toBe('string');
            expect(result).not.toBe(true);
        });

        test('required rule returns true for valid non-empty string', () => {
            const wrapper = shallowMount(inputModule, {
                props: {
                    modelValue: 'test',
                    required: true,
                    schema: { type: 'string' },
                },
            });
            const result = wrapper.vm.$data.rules.required('valid text');
            expect(result).toBe(true);
        });

        test('required rule returns error for empty string when required', () => {
            const wrapper = shallowMount(inputModule, {
                props: {
                    modelValue: '',
                    required: true,
                    schema: { type: 'string' },
                },
            });
            const result = wrapper.vm.$data.rules.required('');
            expect(result).toBe('Required');
        });

        test('required rule returns true for empty string when not required', () => {
            const wrapper = shallowMount(inputModule, {
                props: {
                    modelValue: '',
                    required: false,
                    schema: { type: 'string' },
                },
            });
            const result = wrapper.vm.$data.rules.required('');
            expect(result).toBe(true);
        });

        test('required rule returns true for boolean values', () => {
            const wrapper = shallowMountWithDefaults();
            const result = wrapper.vm.$data.rules.required(false);
            expect(result).toBe(true);
        });

        test('noSpace rule returns error when qid contains spaces', () => {
            const wrapper = shallowMount(inputModule, {
                props: {
                    modelValue: 'test id',
                    schema: { type: 'string', name: 'qid' },
                },
            });
            const result = wrapper.vm.$data.rules.noSpace('test id');
            expect(result).toBe('No Spaces Allowed');
        });

        test('noSpace rule returns true when qid has no spaces', () => {
            const wrapper = shallowMount(inputModule, {
                props: {
                    modelValue: 'testid',
                    schema: { type: 'string', name: 'qid' },
                },
            });
            const result = wrapper.vm.$data.rules.noSpace('testid');
            expect(result).toBe(true);
        });

        test('noSpace rule returns true for non-qid fields', () => {
            const wrapper = shallowMount(inputModule, {
                props: {
                    modelValue: 'test value',
                    schema: { type: 'string', name: 'other' },
                },
            });
            const result = wrapper.vm.$data.rules.noSpace('test value');
            expect(result).toBe(true);
        });
    });
});
