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
import alexaModule from '../../../js/components/designer/alexa.vue';
import { shallowMount } from '@vue/test-utils';

describe('addSetting vue', () => {
    Object.assign(navigator, {
        clipboard: {
            writeText: jest.fn(),
        },
    });

    test('It is there', () => {
        const wrapper = shallowMount(alexaModule);
        expect(wrapper.exists()).toBe(true);
    });

    test('download', async () => {
        const store = {
            dispatch: jest.fn(),
            state: {
                bot: {
                    alexa: '',
                },
            },
        };
        const wrapper = shallowMount(alexaModule, {
            global: {
                mocks: {
                    $store: store,
                }
            }
        });

        await wrapper.vm.download();
        expect(store.dispatch).toHaveBeenCalledWith('data/botinfo');
        expect(wrapper.vm.$data.ready).toBe(true);
    });

    test('copy', async () => {
        const store = {};
        const wrapper = shallowMount(alexaModule, {
            global: {
                mocks: {
                    $store: store,
                }
            }
        });

        wrapper.vm.$data.text = 'test';
        await wrapper.vm.copy();
        expect( navigator.clipboard.writeText).toHaveBeenCalledWith('test');
        expect(wrapper.vm.$data.ready).toBe(false);
    });
});
