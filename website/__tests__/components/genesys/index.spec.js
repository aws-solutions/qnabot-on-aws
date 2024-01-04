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
import indexModule from '../../../js/components/genesys/index.vue';
import { shallowMount } from '@vue/test-utils';

describe('genesys component index', () => {
    test('mounted', () => {
        const store = {
            dispatch: jest.fn().mockImplementation(() => Promise.resolve({})),
        };
        const wrapper = shallowMount(indexModule, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });
        expect(wrapper.exists()).toBe(true);
    });

    test('copy method', async () => {
        global.URL.createObjectURL = jest.fn();
        global.URL.revokeObjectURL = jest.fn();
        const store = {
            dispatch: jest.fn().mockImplementation(() => Promise.resolve('test')),
        };
        const wrapper = shallowMount(indexModule, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });
        const btn = {
            loading: false,
        };

        await wrapper.vm.copy(btn);
        expect(store.dispatch).toHaveBeenCalledWith('api/getGenesysCallFlow');
    });
});
