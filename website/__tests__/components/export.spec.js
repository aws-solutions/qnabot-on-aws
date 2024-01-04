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
