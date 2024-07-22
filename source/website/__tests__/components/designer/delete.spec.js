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
import deleteModule from '../../../js/components/designer/delete.vue';
import { shallowMount } from '@vue/test-utils';

describe('delete vue', () => {
    test('mounted', () => {
        const store = {
            state: {
                data: {
                    QAs: [
                        { select: true, qid: '1' },
                    ],
                    filter: 'test-filter',
                },
            },
        };
        const wrapper = shallowMount(deleteModule, {
            global: {
                mocks: {
                    $store: store,
                }
            }
        });
        wrapper.vm.$data.dialog = true;
        const qas = wrapper.vm.QAs;
        const filter = wrapper.vm.filter;
        expect(wrapper.exists()).toBe(true);
        expect(qas[0].qid).toBe('1');
        expect(filter).toBe('test-filter');
    });

    test('cancel', () => {
        const wrapper = shallowMount(deleteModule);
        wrapper.vm.$data.dialog = true;
        wrapper.vm.cancel();
        expect(wrapper.vm.$data.dialog).toBe(false);
    });

    test('rm', () => {
        const store = {
            state: {
                data: {
                    QAs: [
                        { select: true, qid: '1' },
                    ],
                },
            },
        };
        const wrapper = shallowMount(deleteModule, {
            global: {
                mocks: {
                    $store: store,
                }
            }
        });
        wrapper.vm.rm();
        expect(wrapper.emitted('handleDelete')).toBeTruthy();
    });
});
