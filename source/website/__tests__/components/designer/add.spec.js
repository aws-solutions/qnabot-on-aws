/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
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

    test('add -- markdown sanitized as expected', async () => {
        store.dispatch.mockReturnValueOnce(Promise.resolve(false));
        const wrapper = mount(add, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        wrapper.vm.$data.data = {
            qna: {
                qid:"test",
                q:["test"],
                a:"test",
                alt:{
                    markdown:"<p style='white-space'>Testing Markdown Sanitization</p><test></test>"
                },
                type:"qna"
            }
        };



        await wrapper.vm.add();

        wrapper.vm.$data.data.qna.alt.markdown = "<p>Testing Markdown Sanitization</p>";
        expect(store.dispatch).toHaveBeenNthCalledWith(1, 'api/check', 'test');
        expect(store.dispatch).toHaveBeenNthCalledWith(2, 'data/add', {
                "a": "test",
                "alt": {
                    "markdown": "<p>Testing Markdown Sanitization</p>"
                },
                "q": ["test"],
                "qid": "test",
                "type": "qna"
        });
        
    });

    test('add -- markdown sanitized makes multiple passes', async () => {
        store.dispatch.mockReturnValueOnce(Promise.resolve(false));
        const wrapper = mount(add, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        wrapper.vm.$data.data = {
            qna: {
                qid:"test",
                q:["test"],
                a:"test",
                alt:{
                    markdown:"<scr<scr<badTag></badTag>ipt>"
                },
                type:"qna"
            }
        };
        await wrapper.vm.add();

        wrapper.vm.$data.data.qna.alt.markdown = "";
        expect(store.dispatch).toHaveBeenNthCalledWith(1, 'api/check', 'test');
        expect(store.dispatch).toHaveBeenNthCalledWith(2, 'data/add', {
                "a": "test",
                "alt": {
                    "markdown": "ipt>"
                },
                "q": ["test"],
                "qid": "test",
                "type": "qna"
        });
        
    }); 


});
