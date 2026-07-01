/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import modal from '../../../js/components/designer/modal.vue';

describe('designer/modal.vue', () => {
    test('component mounts successfully', () => {
        const wrapper = shallowMount(modal, {
            props: {
                tableHeader: ['Column1', 'Column2'],
                tableData: [['value1', 'value2']]
            }
        });
        expect(wrapper.exists()).toBe(true);
    });

    test('renders table header correctly', () => {
        const tableHeader = ['Test', 'Result', 'Status'];
        const wrapper = shallowMount(modal, {
            props: {
                tableHeader,
                tableData: []
            }
        });
        expect(wrapper.props('tableHeader')).toEqual(tableHeader);
    });

    test('renders table data correctly', () => {
        const tableData = [
            ['yes', 'passed', 'ok'],
            ['no', 'failed', 'error']
        ];
        const wrapper = shallowMount(modal, {
            props: {
                tableHeader: ['Col1', 'Col2', 'Col3'],
                tableData
            }
        });
        expect(wrapper.props('tableData')).toEqual(tableData);
    });

    test('close method emits closemodal event', () => {
        const wrapper = shallowMount(modal, {
            props: {
                tableHeader: ['Test'],
                tableData: []
            }
        });
        wrapper.vm.close();
        expect(wrapper.emitted('closemodal')).toBeTruthy();
        expect(wrapper.emitted('closemodal')).toHaveLength(1);
    });

    test('getClass returns errorcell for rows starting with "no"', () => {
        const wrapper = shallowMount(modal, {
            props: {
                tableHeader: ['Test'],
                tableData: []
            }
        });
        const result = wrapper.vm.getClass(['no', 'failed']);
        expect(result).toBe('errorcell');
    });

    test('getClass returns errorcell for rows starting with "No"', () => {
        const wrapper = shallowMount(modal, {
            props: {
                tableHeader: ['Test'],
                tableData: []
            }
        });
        const result = wrapper.vm.getClass(['No', 'failed']);
        expect(result).toBe('errorcell');
    });

    test('getClass returns modalrow for rows not starting with "no"', () => {
        const wrapper = shallowMount(modal, {
            props: {
                tableHeader: ['Test'],
                tableData: []
            }
        });
        const result = wrapper.vm.getClass(['yes', 'passed']);
        expect(result).toBe('modalrow');
    });

    test('getClass returns modalrow for empty rows', () => {
        const wrapper = shallowMount(modal, {
            props: {
                tableHeader: ['Test'],
                tableData: []
            }
        });
        const result = wrapper.vm.getClass(['', '']);
        expect(result).toBe('modalrow');
    });

    test('accepts tableContent prop', () => {
        const wrapper = shallowMount(modal, {
            props: {
                tableContent: 'test content',
                tableHeader: ['Test'],
                tableData: []
            }
        });
        expect(wrapper.props('tableContent')).toBe('test content');
    });
});
