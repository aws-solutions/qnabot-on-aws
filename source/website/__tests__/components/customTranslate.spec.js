/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

/**
 * @jest-environment jsdom
 */

import customTranslateModule from '../../js/components/customTranslate.vue'
import { shallowMount } from '@vue/test-utils'

describe('customTranslate component', () => {
    const dispatchMock = (dispatchType) => {
        switch (dispatchType) {
        case 'api/listSettings':
            return [
                {},
                {},
                { ENABLE_CUSTOM_TERMINOLOGY: 'true' },
            ];
        case 'api/getTerminologies':
            return Promise.resolve({ result: {} });
        case 'api/startImportTranslate':
            return Promise.resolve({ result: {} });
        default:
            return Promise.resolve({
                Status: 'success',
                Error: '',
            });
        }
    };

    const shallowMountWithDefaults = () => {
        const store = {
            dispatch: jest.fn().mockImplementation((dispatchType) => dispatchMock(dispatchType)),
        };

        const wrapper = shallowMount(customTranslateModule, {
            global: {
                mocks: {
                    $store: store,
                },
            },
        });

        return { wrapper, store };
    };

    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, "log").mockImplementation(jest.fn());
    });

    test('should mount', async () => {
        const { wrapper, store } = shallowMountWithDefaults();
        await wrapper.vm.$nextTick();
        expect(store.dispatch).toHaveBeenCalledTimes(3);
        expect(store.dispatch).toHaveBeenCalledWith('api/listExamples');
        expect(store.dispatch).toHaveBeenCalledWith('api/getTerminologies');
        expect(store.dispatch).toHaveBeenCalledWith('api/listSettings');
        expect(wrapper.exists()).toBe(true);
    });

    test('CustomTerminologyIsEnabled', async () => {
        const { wrapper } = shallowMountWithDefaults();
        const result = await wrapper.vm.CustomTerminologyIsEnabled();
        expect(result).toBe(true);
    });

    test('close', () => {
        const { wrapper } = shallowMountWithDefaults();
        wrapper.vm.$data.loading = true;
        wrapper.vm.$data.error = true;
        wrapper.vm.close();

        expect(wrapper.vm.$data.loading).toBe(false);
        expect(wrapper.vm.$data.error).toBe(false);
    });

    test('refresh', async () => {
        const { wrapper, store } = shallowMountWithDefaults();
        await wrapper.vm.refresh();
        expect(store.dispatch).toHaveBeenCalledWith('api/getTerminologies');
    });

    test('upload data resolve', async() => {
        const data = {
            Status: 'success',
            Error: ''
        };
        const nam = 'test-name.txt';
        const { wrapper, store } = shallowMountWithDefaults();
        await wrapper.vm.upload(data, nam);

        expect(store.dispatch).toHaveBeenCalledTimes(4);
        expect(store.dispatch).toHaveBeenCalledWith('api/startImportTranslate', {
            name: 'test-name',
            description: null,
            file: window.btoa(data),
        });
    });
});
