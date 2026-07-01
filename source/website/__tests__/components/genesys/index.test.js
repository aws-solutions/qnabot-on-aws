/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import genesysIndex from '../../../js/components/genesys/index.vue';
import { createMockStore, setupDOMMocks, waitForAsync } from '../../helpers/test-utils';

describe('genesys/index.vue', () => {
    let store;
    let mockComponent;

    beforeEach(() => {
        store = createMockStore();
        setupDOMMocks();

        // Create a mock component instance
        mockComponent = {
            $store: store,
            ...genesysIndex.data(),
            ...genesysIndex.methods
        };
    });

    test('initializes with correct data', () => {
        const data = genesysIndex.data();
        expect(data.visible).toBe(false);
        expect(data.stepNumber).toBe(1);
        expect(data.stepsRaw).toBeDefined();
    });

    test('copy method downloads Genesys call flow', async () => {
        const mockCallFlow = 'test: yaml content';
        store.dispatch.mockResolvedValue(mockCallFlow);

        const btn = { loading: false };
        mockComponent.copy(btn);

        await waitForAsync();

        expect(store.dispatch).toHaveBeenCalledWith('api/getGenesysCallFlow');
        expect(btn.loading).toBe(true);
    });

    test('handles copy error gracefully', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        store.dispatch.mockRejectedValue(new Error('API error'));

        const btn = { loading: false };
        mockComponent.copy(btn);

        await waitForAsync(100);

        expect(consoleLogSpy).toHaveBeenCalled();
        consoleLogSpy.mockRestore();
    });
});

