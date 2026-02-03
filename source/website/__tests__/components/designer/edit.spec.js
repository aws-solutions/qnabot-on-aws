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
                            type: 'object',
                            properties: {
                                key: { type: 'string' },
                            },
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
        wrapper.vm.$data.opened = true;
        wrapper.vm.$data.error = 'Some error';
        wrapper.vm.cancel();
        expect(wrapper.vm.$data.dialog).toBe(false);
        expect(wrapper.vm.$data.opened).toBe(false);
        expect(wrapper.vm.$data.error).toBe('');
    });

    test('cancel resets opened flag so data refreshes on next open', () => {
        const data = {
            type: 'qna',
            qid: 'original-id',
            q: ['original question'],
            a: 'original answer',
        };
        const store = {
            state: {
                data: {
                    schema: {
                        qna: {
                            type: 'object',
                            properties: {
                                qid: { type: 'string' },
                                q: { type: 'array', items: { type: 'string' } },
                                a: { type: 'string' },
                                type: { type: 'string' },
                            },
                        },
                    },
                },
            },
        };

        const wrapper = shallowMount(editModule, {
            props: { data },
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        // First open - should initialize tmp
        wrapper.vm.refresh();
        expect(wrapper.vm.$data.opened).toBe(true);
        expect(wrapper.vm.$data.tmp.qid).toBe('original-id');

        // User makes edits
        wrapper.vm.$data.tmp.qid = 'modified-id';
        expect(wrapper.vm.$data.tmp.qid).toBe('modified-id');

        // User cancels
        wrapper.vm.cancel();
        expect(wrapper.vm.$data.opened).toBe(false);

        // User reopens - should refresh from original data
        wrapper.vm.refresh();
        expect(wrapper.vm.$data.opened).toBe(true);
        expect(wrapper.vm.$data.tmp.qid).toBe('original-id');
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
                            type: 'object',
                            properties: {
                                qid: { type: 'string' },
                                q: { type: 'array', items: { type: 'string' } },
                                a: { type: 'string' },
                                alt: { type: 'object' },
                                type: { type: 'string' },
                            },
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

    describe('validation in update method', () => {
        test('update prevents submission when validation fails', async () => {
            const data = {
                qid: 'test',
                q: ['test'],
                a: 'test',
                type: 'qna',
            };

            const store = {
                state: {
                    data: {
                        schema: {
                            qna: {
                                type: 'object',
                                properties: {
                                    qid: { type: 'string', maxLength: 100 },
                                    q: { type: 'array', items: { type: 'string' } },
                                    a: { type: 'string', maxLength: 8000 },
                                    type: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                dispatch: jest.fn().mockReturnValue(false),
            };

            const wrapper = shallowMount(editModule, {
                props: { data },
                global: {
                    mocks: {
                        $store: store,
                    },
                },
            });

            wrapper.vm.$data.tmp = {
                qid: 'test',
                q: ['test'],
                a: 'x'.repeat(8001), // Exceeds 8000 character limit
                type: 'qna',
            };

            await wrapper.vm.update();

            // Should set error and not dispatch update
            expect(wrapper.vm.$data.error).toBeTruthy();
            expect(store.dispatch).not.toHaveBeenCalledWith('data/update', expect.anything());
        });

        test('update allows submission when validation passes', async () => {
            const data = {
                qid: 'test',
                q: ['test'],
                a: 'test',
                type: 'qna',
            };

            const store = {
                state: {
                    data: {
                        schema: {
                            qna: {
                                type: 'object',
                                properties: {
                                    qid: { type: 'string', maxLength: 100 },
                                    q: { type: 'array', items: { type: 'string' } },
                                    a: { type: 'string', maxLength: 8000 },
                                    type: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                dispatch: jest.fn().mockReturnValue(false),
            };

            const wrapper = shallowMount(editModule, {
                props: { data },
                global: {
                    mocks: {
                        $store: store,
                    },
                },
            });

            wrapper.vm.$data.tmp = {
                qid: 'test',
                q: ['test'],
                a: 'valid answer text',
                type: 'qna',
            };

            await wrapper.vm.update();

            // Should not set error and should dispatch update
            expect(wrapper.vm.$data.error).toBe('');
            expect(store.dispatch).toHaveBeenCalledWith('data/update', expect.objectContaining({
                qid: 'test',
                a: 'valid answer text',
            }));
        });

        test('update shows error message when character limit exceeded', async () => {
            const data = {
                qid: 'test',
                q: ['test'],
                a: 'test',
                type: 'qna',
            };

            const store = {
                state: {
                    data: {
                        schema: {
                            qna: {
                                type: 'object',
                                properties: {
                                    qid: { type: 'string', maxLength: 10 },
                                    q: { type: 'array', items: { type: 'string' } },
                                    a: { type: 'string', maxLength: 8000 },
                                    type: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                dispatch: jest.fn().mockReturnValue(false),
            };

            const wrapper = shallowMount(editModule, {
                props: { data },
                global: {
                    mocks: {
                        $store: store,
                    },
                },
            });

            wrapper.vm.$data.tmp = {
                qid: 'this_is_a_very_long_qid_that_exceeds_limit',
                q: ['test'],
                a: 'test',
                type: 'qna',
            };

            await wrapper.vm.update();

            // Should set error message
            expect(wrapper.vm.$data.error).toBeTruthy();
            expect(typeof wrapper.vm.$data.error).toBe('string');
        });

        test('update respects valid flag from form', async () => {
            const data = {
                qid: 'test',
                q: ['test'],
                a: 'test',
                type: 'qna',
            };

            const store = {
                state: {
                    data: {
                        schema: {
                            qna: {
                                type: 'object',
                                properties: {
                                    qid: { type: 'string', maxLength: 100 },
                                    q: { type: 'array', items: { type: 'string' } },
                                    a: { type: 'string', maxLength: 8000 },
                                    type: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                dispatch: jest.fn().mockReturnValue(false),
            };

            const wrapper = shallowMount(editModule, {
                props: { data },
                global: {
                    mocks: {
                        $store: store,
                    },
                },
            });

            wrapper.vm.$data.valid = false;
            wrapper.vm.$data.tmp = {
                qid: 'test',
                q: ['test'],
                a: 'test',
                type: 'qna',
            };

            await wrapper.vm.update();

            // Should not proceed when valid is false
            expect(store.dispatch).not.toHaveBeenCalledWith('data/update', expect.anything());
        });
    });
});
