/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import clientModule from '../js/client.vue';
import { shallowMount } from '@vue/test-utils';

describe('js client module', () => {
    test('mounted', () => {
        const wrapper = shallowMount(clientModule);
        expect(wrapper.exists()).toBe(true);
    });
});
