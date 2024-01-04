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
import settingsModule from '../../js/components/settings.vue';
import { shallowMount } from '@vue/test-utils';

describe('settings module', () => {
    let consoleLogSpy;
    let wrapper;
    let store;

    const shallowMountWithDefaultStore = () => {
        const settings = [
            {}, // default settings
            {}, // custom settings
            {}, // settings holder
        ];
        store.dispatch.mockReturnValue(settings);
        wrapper = shallowMount(settingsModule, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });
    };

    beforeEach(() => {
        jest.resetAllMocks();
        consoleLogSpy = jest.spyOn(console, "log")
        consoleLogSpy.mockImplementation(jest.fn());
        store = {
            dispatch: jest.fn(),
        };
    });

    test('_get_custom_settings', () => {
        shallowMountWithDefaultStore();

        wrapper.vm.$data.defaultSettings = {
            key2: 'value2',
            key3: 'value3',
        };
        wrapper.vm.$data.settingsHolder = {
            key1: 'value1',
            key2: 'a different value',
        }
        wrapper.vm.$data.customSettings = {
            key3: 'value3',
        };

        wrapper.vm._get_custom_settings();
        expect(wrapper.vm.$data.customSettings.key1).toBeDefined();
        expect(wrapper.vm.$data.customSettings.key1).toEqual('value1');
        expect(wrapper.vm.$data.customSettings.key2).toBeDefined();
        expect(wrapper.vm.$data.customSettings.key2).toEqual('a different value');
        expect(wrapper.vm.$data.customSettings.key3).not.toBeDefined();
    });

    test('SaveSettings', async () => {
        const settings = [
            {}, // default settings
            {}, // custom settings
            {}, // settings holder
        ];
        store.dispatch
            .mockReturnValueOnce(settings)
            .mockReturnValueOnce(false);
        wrapper = shallowMount(settingsModule, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });

        wrapper.vm.$data.showAlert = false;
        await wrapper.vm.SaveSettings();
        expect(wrapper.vm.$data.showAlert).toEqual(true);
    });

    test('showModal / closeModal', async () => {
        shallowMountWithDefaultStore();

        wrapper.vm.showModal();
        expect(wrapper.vm.$data.showAddModal).toEqual(true);

        wrapper.vm.closeModal();
        expect(wrapper.vm.$data.showAddModal).toEqual(false);
    });

    test('addSetting', async () => {
        shallowMountWithDefaultStore();

        const newValue = 'new value';
        const newKey = 'newKey';
        wrapper.vm.$data.newKey = newKey;
        wrapper.vm.$data.newValue = newValue;

        expect(wrapper.vm.$data.mergedSettings.newKey).not.toBeDefined();
        expect(wrapper.vm.$data.customSettings.newKey).not.toBeDefined();
        expect(wrapper.vm.$data.settingsHolder.newKey).not.toBeDefined();

        wrapper.vm.addSetting();

        expect(wrapper.vm.$data.mergedSettings.newKey).toBeDefined();
        expect(wrapper.vm.$data.customSettings.newKey).toBeDefined();
        expect(wrapper.vm.$data.settingsHolder.newKey).toBeDefined();
        expect(wrapper.vm.$data.mergedSettings.newKey).toEqual(newValue);
        expect(wrapper.vm.$data.customSettings.newKey).toEqual(newValue);
        expect(wrapper.vm.$data.settingsHolder.newKey).toEqual(newValue);

        expect(wrapper.vm.$data.newKey).toEqual('');
        expect(wrapper.vm.$data.newValue).toEqual('');
    });

    test('resetToDefaults', async () => {
        const windowSpy = jest.spyOn(window, 'window', 'get');
        windowSpy.mockImplementation(() => ({
            scrollTo: jest.fn(),
        }));
        const settings = [
            {}, // default settings
            {}, // custom settings
            {}, // settings holder
        ];
        store.dispatch
            .mockReturnValueOnce(settings)
            .mockReturnValueOnce(false);
        wrapper = shallowMount(settingsModule, {
            global: {
                mocks: {
                    $store: store
                }
            }
        });

        await wrapper.vm.resetToDefaults();
        expect(wrapper.vm.$data.customSettings).toEqual({});
    });
});
