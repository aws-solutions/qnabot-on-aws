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