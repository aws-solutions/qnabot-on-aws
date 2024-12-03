/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import exportModule from '../../js/components/export.vue';
import { shallowMount } from '@vue/test-utils'

describe('export component', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, "log").mockImplementation(jest.fn());
    });

    test('should mount', async () => {
        const store = {
            dispatch: jest.fn(),
        };
        const exportsJobs = { jobs: ['job1'] };

        store.dispatch
            .mockImplementationOnce(() => Promise.resolve(exportsJobs))
            .mockImplementationOnce(() => Promise.resolve('info'))
            .mockImplementationOnce(() => Promise.resolve({ status: 'Completed' }));

        const wrapper = shallowMount(exportModule, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });
        expect(wrapper.exists()).toBe(true);
    });

    test('poll once more', () => {
        const store = {
            dispatch: jest.fn(),
        };
        const exportsJobs = { jobs: ['job1'] };

        store.dispatch
            .mockImplementationOnce(() => Promise.resolve(exportsJobs))
            .mockImplementationOnce(() => Promise.resolve('info'))
            .mockImplementationOnce(() => Promise.resolve({ status: 'In-Progress' }))
            .mockImplementationOnce(() => Promise.resolve({ status: 'Completed' }));

        const wrapper = shallowMount(exportModule, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });
        expect(wrapper.exists()).toBe(true);
    });
});
