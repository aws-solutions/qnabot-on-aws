/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const qaModule = require('../../../js/components/designer/qa.vue');
import { shallowMount } from '@vue/test-utils';

describe('designer qa module', () => {
    test('mounted', () => {
        const wrapper = shallowMount(qaModule);
        expect(wrapper.exists()).toBe(true);
    });

    test('computed properties', () => {
        const store = {
            state: {
                data: {
                    schema: {
                        qna: 'test-data',
                    }
                }
            }
        }
        const data = {};
        const wrapper = shallowMount(qaModule, {
            props: {
                data,
            },
            global: {
                mocks: {
                    $store: store,
                },
            },
        });
        expect(wrapper.vm.type).toEqual('qna');
        expect(wrapper.vm.schema).toEqual('test-data');
        expect(wrapper.vm.extra).toEqual(false);
        expect(wrapper.vm.items).toEqual({});
        expect(wrapper.vm.topitems).toEqual({});
        expect(wrapper.vm.bottomitems).toEqual({});
    });
});