/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import kendraIndexModule from '../../js/components/kendraIndex.vue';
import { shallowMount } from '@vue/test-utils';

describe('kendraIndex component', () => {
    let store;
    let consoleLogSpy;

    const shallowMountWithDefaultStore = () => {
        store.dispatch.mockImplementation((eventName) => {
            switch (eventName) {
            case 'api/getKendraIndexingStatus':
                return {
                    Error: '',
                    DashboardUrl: 'https://test.com',
                    Status: 'SUCCESS',
                    History: '',
                };
            case 'api/listSettings':
                return [
                    {},
                    {},
                    {
                        ENABLE_KENDRA_WEB_INDEXER: 'true',
                        KENDRA_INDEXER_URLS: 'https://test.com',
                        KENDRA_WEB_PAGE_INDEX: '1',
                    },
                ];
            case 'api/startKendraV2Indexing':
                return Promise.resolve({});
            default:
                return {};
            }
        });
        const wrapper = shallowMount(kendraIndexModule, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        return wrapper;
    };

    beforeEach(() => {
        jest.resetAllMocks();
        consoleLogSpy = jest.spyOn(console, "log")
        consoleLogSpy.mockImplementation(jest.fn());
        jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
            if (typeof fn === 'function') {
                fn();
            }
        });
        store = {
            dispatch: jest.fn(),
        };
    });

    test('mounted', () => {
        const wrapper = shallowMountWithDefaultStore();
        expect(wrapper.exists()).toBe(true);
    });

    test('start', async () => {
        const wrapper = shallowMountWithDefaultStore();
        await wrapper.vm.start();
        expect(wrapper.vm.$data.status).toBe('SUCCESS');
    });
});