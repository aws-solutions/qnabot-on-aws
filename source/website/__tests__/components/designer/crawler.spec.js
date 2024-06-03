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
import crawlerModule from '../../../js/components/designer/crawler.vue';
import { shallowMount } from '@vue/test-utils';

describe('crawler vue', () => {
    let documentSpy;

    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(global, 'setTimeout').mockImplementation((fn) => {
            if (typeof fn === 'function') {
                fn();
            }
        });
        documentSpy = jest.spyOn(document, 'getElementById').mockImplementation((elementId) => {
            if (elementId === 'btnKendraStartIndex') {
                return {
                    offsetWidth: 0,
                };
            }
        });
    });

    test('mounted', () => {
        const store = {
            dispatch: jest.fn(),
        }
        const settings = [
            {}, // default settings
            {}, // custom settings
            {
                ENABLE_KENDRA_WEB_INDEXER: true,
                KENDRA_INDEXER_URLS: 'https://test.com/tests',
                KENDRA_WEB_PAGE_INDEX: '1',
            }, // settings holder
        ];
        store.dispatch.mockReturnValueOnce(settings);
        const wrapper = shallowMount(crawlerModule, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });
        expect(wrapper.exists()).toBe(true);
    });

    test('start', async () => {
        const store = {
            dispatch: jest.fn(),
        }
        const settings = [
            {}, // default settings
            {}, // custom settings
            {
                ENABLE_KENDRA_WEB_INDEXER: true,
                KENDRA_INDEXER_URLS: 'https://test.com/tests',
                KENDRA_WEB_PAGE_INDEX: '1',
            }, // settings holder
        ];
        let getKendraIndexingStatusCounter = 0;
        store.dispatch.mockImplementation((eventName) => {
            switch (eventName) {
            case 'api/listSettings':
                return settings;
            case 'api/startKendraIndexing':
                return Promise.resolve({
                    Status: 'SUCCESS',
                });
            case 'api/getKendraIndexingStatus':
                getKendraIndexingStatusCounter += 1;
                return {
                    Status: 'SUCCESS',
                    History: '',
                }
            default:
                return {};
            };
        });

        const wrapper = shallowMount(crawlerModule, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        wrapper.vm.$data.lastStatusCheck = Date.now() - 10000;
        await wrapper.vm.start();
        expect(store.dispatch).toHaveBeenCalledTimes(4);
        expect(store.dispatch).toHaveBeenCalledWith('api/startKendraIndexing');
        expect(store.dispatch).toHaveBeenCalledWith('api/getKendraIndexingStatus');

        // getKendraIndexingStatus is expected to be called twice.
        expect(getKendraIndexingStatusCounter).toBe(2);
    });
});
