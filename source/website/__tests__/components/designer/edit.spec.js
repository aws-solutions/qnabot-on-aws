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
import editModule from '../../../js/components/designer/edit.vue';
import { shallowMount } from '@vue/test-utils';

describe('designer edit module', () => {

    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(jest.fn());
    });

    const shallowMountWithTmpData = () => {
        const data = {
            type: 'qna',
            qid: '1',
            tmp: {
                quniqueterms: 'some-test-terms',
            },
        };
        const store = {
            state: {
                data: {
                    schema: {
                        qna: {
                            key: 'value',
                            required: true,
                        },
                    },
                },
            },
            dispatch: jest.fn().mockReturnValue(false),
        };

        const wrapper = shallowMount(editModule, {
            props: {
                data,
            },
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        return wrapper;
    };

    test('mounted', () => {
        const wrapper = shallowMount(editModule);
        expect(wrapper.exists()).toBe(true);
    });

    test('computed properties', () => {
        const data = {
            type: 'qna',
        };
        const store = {
            state: {
                data: {
                    schema: {
                        qna: {
                            key: 'value',
                            required: true,
                        },
                    },
                },
            },
        };

        const wrapper = shallowMount(editModule, {
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
        expect(wrapper.vm.schema).toEqual({ key: 'value', required: true });
        expect(wrapper.vm.required).toBe(true);
    });

    test('computed properties -- default data type', () => {
        const data = {};
        const store = {
            state: {
                data: {
                    schema: {
                        qna: {
                            key: 'value',
                            required: true,
                        },
                    },
                },
            },
        };

        const wrapper = shallowMount(editModule, {
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
        expect(wrapper.vm.schema).toEqual({ key: 'value', required: true });
        expect(wrapper.vm.required).toBe(true);
    });

    test('cancel', () => {
        const wrapper = shallowMount(editModule);
        wrapper.vm.$data.dialog = true;
        wrapper.vm.cancel();
        expect(wrapper.vm.$data.dialog).toBe(false);
    });

    test('close', () => {
        const wrapper = shallowMount(editModule);
        wrapper.vm.close();
        expect(wrapper.emitted('filter')).toBeTruthy();
    });

    test('refresh', () => {
        const data = {
            type: 'qna',
        };
        const store = {
            state: {
                data: {
                    schema: {
                        qna: {
                            key: 'value',
                            required: true,
                        },
                    },
                },
            },
        };

        const wrapper = shallowMount(editModule, {
            props: {
                data,
            },
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        wrapper.vm.$data.opened = false;
        wrapper.vm.refresh();
        expect(wrapper.vm.$data.opened).toBe(true);
    });

    test('update', () => {
        const wrapper = shallowMountWithTmpData();
        wrapper.vm.$data.tmp = {
            quniqueterms: 'some-test-terms',
        };
        wrapper.vm.update();
        expect(wrapper.vm.update).not.toThrow();
    });

    test('update -- empty tmp', () => {
        const wrapper = shallowMountWithTmpData();
        wrapper.vm.update();
        expect(wrapper.vm.update).not.toThrow();
    });
});
