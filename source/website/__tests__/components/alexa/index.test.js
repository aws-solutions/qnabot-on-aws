/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import alexaIndex from '../../../js/components/alexa/index.vue';

describe('alexa/index.vue', () => {
    let store;
    let wrapper;

    beforeEach(() => {
        store = {
            state: {
                bot: {
                    lambdaArn: 'arn:aws:lambda:us-east-1:123456789:function:test',
                    alexa: {
                        endpoint: 'https://test.example.com',
                        skillId: 'test-skill-id'
                    }
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
        wrapper = shallowMount(alexaIndex, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });
        expect(wrapper.exists()).toBe(true);
    });

    test('initializes with correct data', () => {
        wrapper = shallowMount(alexaIndex, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });
        expect(wrapper.vm.visible).toBe(false);
        expect(wrapper.vm.stepNumber).toBe(1);
        expect(wrapper.vm.stepsRaw).toBeDefined();
    });

    test('dispatches botinfo on created', () => {
        wrapper = shallowMount(alexaIndex, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });
        expect(store.dispatch).toHaveBeenCalledWith('data/botinfo');
    });

    test('computes steps from stepsRaw', () => {
        wrapper = shallowMount(alexaIndex, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });
        expect(wrapper.vm.steps).toBeDefined();
        expect(Array.isArray(wrapper.vm.steps)).toBe(true);
    });

    test('copy method copies lambdaArn to clipboard', async () => {
        wrapper = shallowMount(alexaIndex, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });

        const btn = { id: 'LambdaArn', loading: false };
        wrapper.vm.copy(btn);

        expect(btn.loading).toBe(true);
        await vi.waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(store.state.bot.lambdaArn);
        });
    });

    test('copy method copies alexa config to clipboard', async () => {
        wrapper = shallowMount(alexaIndex, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });

        const btn = { id: 'AlexaConfig', loading: false };
        wrapper.vm.copy(btn);

        expect(btn.loading).toBe(true);
        await vi.waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
                JSON.stringify(store.state.bot.alexa, null, 2)
            );
        });
    });

    test('handles clipboard error gracefully', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('Clipboard error'));

        wrapper = shallowMount(alexaIndex, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });

        const btn = { id: 'LambdaArn', loading: false };
        wrapper.vm.copy(btn);

        await vi.waitFor(() => {
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        consoleLogSpy.mockRestore();
    });
});
