/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import hooksIndex from '../../../js/components/hooks/index.vue';

describe('hooks/index.vue', () => {
    let store;
    let wrapper;

    beforeEach(() => {
        store = {
            state: {
                bot: {
                    lambdaRole: 'arn:aws:iam::123456789:role/test-role'
                }
            },
            dispatch: vi.fn().mockResolvedValue({})
        };

        // Mock clipboard API
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined)
            }
        });
    });

    test('component mounts successfully', () => {
        wrapper = shallowMount(hooksIndex, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });
        expect(wrapper.exists()).toBe(true);
    });

    test('initializes with correct data', () => {
        wrapper = shallowMount(hooksIndex, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });
        expect(wrapper.vm.visible).toBe(false);
        expect(wrapper.vm.stepNumber).toBe(1);
        expect(wrapper.vm.prefix).toBe('qna');
        expect(wrapper.vm.stepsRaw).toBeDefined();
    });

    test('computes steps from stepsRaw', () => {
        wrapper = shallowMount(hooksIndex, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });
        expect(wrapper.vm.steps).toBeDefined();
        expect(Array.isArray(wrapper.vm.steps)).toBe(true);
    });

    test('copy method copies role ARN to clipboard', async () => {
        wrapper = shallowMount(hooksIndex, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });

        const btn = { id: 'Role', loading: false };
        await wrapper.vm.copy(btn);

        expect(store.dispatch).toHaveBeenCalledWith('data/botinfo');
        await vi.waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(store.state.bot.lambdaRole);
        });
    });

    test('copy method copies JavaScript code to clipboard', async () => {
        wrapper = shallowMount(hooksIndex, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });

        const btn = { id: 'code-js', loading: false };
        wrapper.vm.copy(btn);

        expect(btn.loading).toBe(true);
        await vi.waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalled();
        });
    });

    test('copy method copies Python code to clipboard', async () => {
        wrapper = shallowMount(hooksIndex, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });

        const btn = { id: 'code-py', loading: false };
        wrapper.vm.copy(btn);

        expect(btn.loading).toBe(true);
        await vi.waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalled();
        });
    });

    test('copy method copies example JSON to clipboard', async () => {
        wrapper = shallowMount(hooksIndex, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });

        const btn = { id: 'example', loading: false };
        wrapper.vm.copy(btn);

        expect(btn.loading).toBe(true);
        await vi.waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalled();
        });
    });

    test('handles clipboard error gracefully', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('Clipboard error'));

        wrapper = shallowMount(hooksIndex, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });

        const btn = { id: 'code-js', loading: false };
        wrapper.vm.copy(btn);

        await vi.waitFor(() => {
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        consoleLogSpy.mockRestore();
    });
});
