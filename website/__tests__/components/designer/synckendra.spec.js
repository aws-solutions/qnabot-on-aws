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
const synckendraModule = require('../../../js/components/designer/synckendra.vue');
import { shallowMount } from '@vue/test-utils';

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
            dispatch: jest.fn().mockImplementation((dispatchType) => dispatchMock(dispatchType)),
        }
        const wrapper = shallowMount(synckendraModule, {
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
            dispatch: jest.fn().mockImplementation((dispatchType) => dispatchMock(dispatchType)),
        }
        const wrapper = shallowMount(synckendraModule, {
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
            dispatch: jest.fn().mockImplementation((dispatchType) => dispatchMock(dispatchType)),
        };
        const wrapper = shallowMount(synckendraModule, {
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
