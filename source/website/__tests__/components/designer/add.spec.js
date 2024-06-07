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
import add from '../../../js/components/designer/add.vue';
import { mount } from '@vue/test-utils';

describe('add vue', () => {
    const store = {
        dispatch: jest.fn(),
        state: {
            data: {
                schema: {
                    qna: {},
                },
            },
        },
    };

    beforeEach(() => {
        jest.resetAllMocks();
    });

    test('It is there', () => {
        const wrapper = mount(add, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        expect(wrapper.exists()).toBe(true);
    });

    test('computed methods', () => {
        const wrapper = mount(add, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        expect(wrapper.vm.types).toEqual(['qna']);
        expect(wrapper.vm.schema).toEqual({});
        expect(wrapper.vm.required).toEqual([]);
    });

    test('cancel', () => {
        const wrapper = mount(add, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        wrapper.vm.cancel();
        expect(wrapper.vm.$data.loading).toEqual(false);
        expect(wrapper.vm.$data.dialog).toEqual(false);
    });

    test('add -- data exists', async () => {
        store.dispatch.mockReturnValueOnce(Promise.resolve(true));
        const wrapper = mount(add, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        wrapper.vm.$data.data = {
            qna: {
                qid: '1',
            },
        };

        await wrapper.vm.add();
        expect(store.dispatch).toHaveBeenCalledWith('api/check', '1');
    });
});
