/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import menuTestall from '../../../js/components/designer/menu-testall.vue';

describe('designer/menu-testall.vue', () => {
    let store;
    let wrapper;

    beforeEach(() => {
        store = {
            dispatch: vi.fn().mockResolvedValue({ 
                lexV2localeids: 'en_US',
                jobs: []
            })
        };

        global.sessionStorage = {
            getItem: vi.fn(() => 'test-token')
        };
    });

    test('component mounts successfully', async () => {
        store.dispatch
            .mockResolvedValueOnce({ lexV2localeids: 'en_US,es_US' })
            .mockResolvedValueOnce({ jobs: [] });
            
        wrapper = shallowMount(menuTestall, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });
        
        await wrapper.vm.$nextTick();
        expect(wrapper.exists()).toBe(true);
    });

    test('initializes with correct data', async () => {
        store.dispatch
            .mockResolvedValueOnce({ lexV2localeids: 'en_US' })
            .mockResolvedValueOnce({ jobs: [] });
            
        wrapper = shallowMount(menuTestall, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });
        
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.isModalVisible).toBe(false);
        expect(wrapper.vm.loading).toBe(false);
        expect(wrapper.vm.error).toBe('');
        expect(wrapper.vm.filename).toBe('TestAll');
        expect(wrapper.vm.filter).toBe('');
    });

    test('refresh fetches bot info and test jobs', async () => {
        const mockBotInfo = { lexV2localeids: 'en_US,es_US' };
        const mockTestalls = { jobs: [{ id: 'job1', status: 'Completed' }] };
        const mockJobInfo = { status: 'Completed', progress: 100 };

        store.dispatch
            .mockResolvedValueOnce(mockBotInfo)
            .mockResolvedValueOnce(mockTestalls)
            .mockResolvedValueOnce(mockJobInfo);

        wrapper = shallowMount(menuTestall, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });

        // Wait for created hook to complete
        await wrapper.vm.$nextTick();
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(store.dispatch).toHaveBeenCalledWith('api/getBotInfo');
        expect(store.dispatch).toHaveBeenCalledWith('api/listTestAll');
        expect(wrapper.vm.localeIds).toEqual(['en_US', 'es_US']);
    });

    test('dateFormat formats date correctly', async () => {
        store.dispatch
            .mockResolvedValueOnce({ lexV2localeids: 'en_US' })
            .mockResolvedValueOnce({ jobs: [] });
            
        wrapper = shallowMount(menuTestall, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });

        await wrapper.vm.$nextTick();
        const date = new Date('2024-01-15T10:30:45.123Z');
        const formatted = wrapper.vm.dateFormat(date);
        expect(formatted).toMatch(/2024-01-15-\d{2}-\d{2}-\d{3}/);
    });

    test('start creates new test job', async () => {
        const mockBotInfo = { lexV2localeids: 'en_US' };
        const mockTestalls = { jobs: [] };
        const mockJobInfo = { status: 'Completed', progress: 100 };
        
        // Set up comprehensive mocking for all dispatch calls
        store.dispatch = vi.fn((action, payload) => {
            if (action === 'api/getBotInfo') return Promise.resolve(mockBotInfo);
            if (action === 'api/listTestAll') return Promise.resolve(mockTestalls);
            if (action === 'api/startTestAll') return Promise.resolve({});
            if (action === 'api/getTestAll') return Promise.resolve(mockJobInfo);
            return Promise.resolve({});
        });

        wrapper = shallowMount(menuTestall, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });

        await wrapper.vm.$nextTick();
        await new Promise(resolve => setTimeout(resolve, 100));

        wrapper.vm.filename = 'MyTest';
        wrapper.vm.filter = 'test-filter';
        wrapper.vm.selectedLocale = 'en_US';

        await wrapper.vm.start();
        // Wait for the 3 second delay in start() plus refresh
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(store.dispatch).toHaveBeenCalledWith('api/startTestAll', expect.objectContaining({
            filter: 'test-filter',
            locale: 'en_US',
            token: 'test-token'
        }));
    }, 10000); // Increase timeout to 10 seconds

    test('remove deletes test job', async () => {
        const mockJobs = [{ id: 'job1' }, { id: 'job2' }];
        const mockBotInfo = { lexV2localeids: 'en_US' };
        const mockTestalls = { jobs: [{ id: 'job2' }] };
        
        store.dispatch = vi.fn((action, payload) => {
            if (action === 'api/getBotInfo') return Promise.resolve(mockBotInfo);
            if (action === 'api/listTestAll') return Promise.resolve(mockTestalls);
            if (action === 'api/deleteTestAll') return Promise.resolve({});
            if (action === 'api/getTestAll') return Promise.resolve({ status: 'Completed', progress: 100 });
            return Promise.resolve({});
        });

        wrapper = shallowMount(menuTestall, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });

        await wrapper.vm.$nextTick();
        await new Promise(resolve => setTimeout(resolve, 100));

        wrapper.vm.testjobs = mockJobs;
        await wrapper.vm.remove(0);

        expect(store.dispatch).toHaveBeenCalledWith('api/deleteTestAll', mockJobs[0]);
    });

    test('download retrieves and saves test results', async () => {
        const mockRaw = 'test,result\npass,ok';
        store.dispatch
            .mockResolvedValueOnce({ lexV2localeids: 'en_US' })
            .mockResolvedValueOnce({ jobs: [] })
            .mockResolvedValue(mockRaw);

        wrapper = shallowMount(menuTestall, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });

        // Wait for created hook
        await wrapper.vm.$nextTick();

        wrapper.vm.testjobs = [{ id: 'test-job.csv' }];
        const result = await wrapper.vm.download(0);

        expect(store.dispatch).toHaveBeenCalledWith('api/downloadTestAll', { id: 'test-job.csv' });
        expect(result).toBeDefined();
    });

    test('quickview parses CSV and shows modal', async () => {
        const mockRaw = 'header1,header2,header3\nvalue1,value2,value3\nvalue4,value5,value6';
        store.dispatch
            .mockResolvedValueOnce({ lexV2localeids: 'en_US' })
            .mockResolvedValueOnce({ jobs: [] })
            .mockResolvedValue(mockRaw);

        wrapper = shallowMount(menuTestall, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });

        // Wait for created hook
        await wrapper.vm.$nextTick();

        wrapper.vm.testjobs = [{ id: 'test.csv' }];
        await wrapper.vm.quickview(0);

        expect(wrapper.vm.tableHeader).toEqual(['header1', 'header2', 'header3']);
        expect(wrapper.vm.tableData).toHaveLength(2);
        expect(wrapper.vm.isModalVisible).toBe(true);
    });
});
