/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
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

    test('update -- markdown sanitized', async () => {
        const data = {
            qid:"test",
            q:["test"],
            a:"test",
            alt:{
                markdown:"<p style='white-space'>Testing Markdown Sanitization</p><test></test>"
            },
            type:"qna",
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
                tmp: {
                    quniqueterms: 'some-test-terms',
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
        wrapper.vm.$data.tmp = {
            quniqueterms: 'some-test-terms',
            qid:"test",
            q:["test"],
            a:"test",
            alt:{
                markdown:"<p style='white-space'>Testing Markdown Sanitization</p><test></test>"
            },
            type:"qna",
        };

        await wrapper.vm.update();

        expect(store.dispatch).toHaveBeenCalledWith('data/update', { 
            qid:"test",
            q:["test"],
            a:"test",
            alt:{
                markdown:"<p>Testing Markdown Sanitization</p>"
            },
            type:"qna",
         });
    });
});
