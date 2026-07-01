/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

const synckendraModule = await import('../../../js/components/designer/synckendra.vue');

describe('designer synckendra module', () => {
    const dispatchMock = (dispatchType) => {
        switch (dispatchType) {
        case 'api/listSettings':
            return [
                {},
                {},
                { KENDRA_FAQ_INDEX: 'test-index' }, //settings
            ];
        case 'api/listExports':
            return {
                jobs: [],
            };
        case 'api/getExportByJobId':
            return 'Sync Complete';
        default:
            return Promise.resolve({});
        };
    };

    test('mounted', () => {
        const store = {
            dispatch: vi.fn().mockImplementation((dispatchType) => dispatchMock(dispatchType)),
        }
        const wrapper = shallowMount(synckendraModule.default, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });
        expect(wrapper.exists()).toBe(true);
    });

    test('refresh', async () => {
        const store = {
            dispatch: vi.fn().mockImplementation((dispatchType) => dispatchMock(dispatchType)),
        }
        const wrapper = shallowMount(synckendraModule.default, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });
        await wrapper.vm.refresh();
        expect(store.dispatch).toHaveBeenCalledWith('api/listExports');
        expect(store.dispatch).toHaveBeenCalledWith('api/getExportByJobId', 'qna-kendra-faq.txt');
    });

    test('start', async() => {
        const store = {
            dispatch: vi.fn().mockImplementation((dispatchType) => dispatchMock(dispatchType)),
        };
        const wrapper = shallowMount(synckendraModule.default, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });
        await wrapper.vm.start();
        expect(store.dispatch).toHaveBeenCalledWith('api/startKendraSyncExport', {
            name: 'qna-kendra-faq.txt',
            filter: '',
        });
    });
});
