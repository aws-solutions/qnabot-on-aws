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
const rebuildModule = require('../../../js/components/designer/rebuild.vue');
import { shallowMount } from '@vue/test-utils';

describe('designer rebuild module', () => {
    test('mounted', () => {
        const wrapper = shallowMount(rebuildModule);
        expect(wrapper.exists()).toBe(true);
    });

    test('computed properties', () => {
        const store = {
            state: {
                bot: {
                    status: 'not ready',
                    build: {
                        message: 'test-message',
                    },
                },
            },
        };
        const wrapper = shallowMount(rebuildModule, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        expect(wrapper.vm.message).toEqual('test-message');
        expect(wrapper.vm.status).toEqual('not ready');
    });

    test('build & cancel mthods', () => {
        const store = {
            dispatch: jest.fn().mockImplementation(() => Promise.resolve({})),
        };
        const wrapper = shallowMount(rebuildModule, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        wrapper.vm.build();
        wrapper.vm.cancel();
        expect(store.dispatch).toHaveBeenCalledTimes(1);
        expect(store.dispatch).toHaveBeenCalledWith('data/build');
    });
});
