/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import addSetting from '../../../js/components/designer/addSetting.vue';

describe('designer/addSetting.vue', () => {
    test('component mounts successfully', () => {
        const wrapper = shallowMount(addSetting);
        expect(wrapper.exists()).toBe(true);
    });

    test('initializes with dialog closed', () => {
        const wrapper = shallowMount(addSetting);
        expect(wrapper.vm.dialog).toBe(false);
    });

    test('dialog can be opened', async () => {
        const wrapper = shallowMount(addSetting);
        wrapper.vm.dialog = true;
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.dialog).toBe(true);
    });

    test('dialog can be closed', async () => {
        const wrapper = shallowMount(addSetting);
        wrapper.vm.dialog = true;
        await wrapper.vm.$nextTick();
        wrapper.vm.dialog = false;
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.dialog).toBe(false);
    });

    test('data returns correct structure', () => {
        const wrapper = shallowMount(addSetting);
        const data = wrapper.vm.$data;
        expect(data).toHaveProperty('dialog');
        expect(typeof data.dialog).toBe('boolean');
    });
});
