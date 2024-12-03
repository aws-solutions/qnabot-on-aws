/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import addSettingModule from '../../../js/components/designer/addSetting.vue';
import { mount } from '@vue/test-utils';

describe('addSetting vue', () => {
    test('It is there', () => {
        const wrapper = mount(addSettingModule);
        expect(wrapper.exists()).toBe(true);
    });
});
