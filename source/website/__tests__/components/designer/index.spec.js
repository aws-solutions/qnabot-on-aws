/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const indexModule = require('../../../js/components/designer/index.vue');
import { shallowMount } from '@vue/test-utils'

describe('designer index component', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    test('it mounted', () => {
        const store = {
            dispatch: jest.fn().mockImplementation(() => Promise.resolve({})),
        };
        const wrapper = shallowMount(indexModule, {
            global: {
                mocks: {
                    $store: store,
                }
            }
        });
        expect(wrapper.exists()).toBe(true);
    });

    test('computed properties', () => {
        const store = {
            dispatch: jest.fn().mockImplementation(() => Promise.resolve({})),
            state: {
                data: {
                    loading: true,
                    QAs: [{ select: true }],
                },
                page: {
                    total: 100,
                },
            }
        }
        const wrapper = shallowMount(indexModule, {
            global: {
                mocks: {
                    $store: store,
                }
            }
        });

        expect(wrapper.vm.loading).toBe(true);
        expect(wrapper.vm.QAs).toEqual([{ select: true }]);
        expect(wrapper.vm.total).toBe(100);
        expect(wrapper.vm.empty).toEqual({ empty: false });
        expect(wrapper.vm.selectedMultiple).toBe(true);
    });

    test('loadItems & refresh', () => {
        const store = {
            dispatch: jest.fn().mockImplementation(() => Promise.resolve({})),
            state: {
                data: {
                    loading: true,
                    QAs: [{ select: true }],
                },
                page: {
                    total: 100,
                },
            }
        }
        const wrapper = shallowMount(indexModule, {
            global: {
                mocks: {
                    $store: store,
                }
            }
        });

        wrapper.vm.loadItems({ page: 5, sortBy: 'asc' });
        expect(wrapper.vm.$data.page).toEqual(5);
        expect(wrapper.vm.$data.sortBy).toEqual('asc');
    });

    test('refresh', () => {
        const store = {
            dispatch: jest.fn().mockImplementation(() => Promise.resolve({})),
            state: {
                data: {
                    loading: true,
                    QAs: [{ select: true }],
                },
                page: {
                    total: 100,
                },
            }
        }
        const wrapper = shallowMount(indexModule, {
            global: {
                mocks: {
                    $store: store,
                }
            }
        });

        wrapper.vm.loadItems({ page: 5, sortBy: 'asc' });
        wrapper.vm.refresh();
        expect(wrapper.vm.$data.itemsPerPage).toEqual(100);
        expect(wrapper.vm.$data.page).toEqual(1);
        expect(wrapper.vm.$data.sortBy).toEqual([]);
    });

    test('checkSelect', () => {
        const store = {
            dispatch: jest.fn().mockImplementation(() => Promise.resolve({})),
        };
        const wrapper = shallowMount(indexModule, {
            global: {
                mocks: {
                    $store: store,
                }
            }
        });

        wrapper.vm.$data.selectAll = false;
        wrapper.vm.checkSelect(true);
        expect(wrapper.vm.$data.selectAll).toBe(false);
        
        wrapper.vm.$data.selectAll = true;
        wrapper.vm.checkSelect(true);
        expect(wrapper.vm.$data.selectAll).toBe(true);

        wrapper.vm.$data.selectAll = true;
        wrapper.vm.checkSelect(false);
        expect(wrapper.vm.$data.selectAll).toBe(false);
    });

    test('toggleSelectAll', () => {
        const store = {
            dispatch: jest.fn().mockImplementation(() => Promise.resolve({})),
            commit: jest.fn(),
        };
        const wrapper = shallowMount(indexModule, {
            global: {
                mocks: {
                    $store: store,
                }
            }
        });

        wrapper.vm.toggleSelectAll();
        expect(store.commit).toHaveBeenCalledWith('data/selectAll', wrapper.vm.$data.selectAll);
    });

    test('deleteClose', () => {
        const store = {
            dispatch: jest.fn().mockImplementation(() => Promise.resolve({})),
        };
        const wrapper = shallowMount(indexModule, {
            global: {
                mocks: {
                    $store: store,
                }
            }
        });

        wrapper.vm.deleteClose();
        expect(wrapper.vm.$data.deleteLoading).toEqual(false);
        expect(wrapper.vm.$data.deleteError).toEqual('');
        expect(wrapper.vm.$data.deleteSuccess).toEqual('');
        expect(wrapper.vm.$data.deleteIds).toEqual([]);
    });

    test('handleDelete', async () => {
        const store = {
            dispatch: jest.fn().mockImplementation(() => Promise.resolve({})),
            commit: jest.fn().mockImplementation(() => Promise.resolve({})),
        };
        const wrapper = shallowMount(indexModule, {
            global: {
                mocks: {
                    $store: store,
                }
            }
        });
        const questions = [
            { qid: 1 },
        ];

        await wrapper.vm.handleDelete(questions);
        expect(wrapper.vm.deleteSuccess).toEqual('Success!');

        wrapper.vm.$data.selectAll = true;
        wrapper.vm.$data.deleteSuccess = '';
        await wrapper.vm.handleDelete(questions);
        expect(wrapper.vm.deleteSuccess).toEqual('Success!');
    });
});
