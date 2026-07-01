/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import connectIndex from '../../../js/components/connect/index.vue';
import { createMockStore, setupDOMMocks, waitForAsync } from '../../helpers/test-utils';

describe('connect/index.vue', () => {
    let store;
    let mockComponent;

    beforeEach(() => {
        store = createMockStore();
        setupDOMMocks();

        // Create a mock component instance
        mockComponent = {
            $store: store,
            ...connectIndex.data(),
            ...connectIndex.methods
        };
    });

    test('initializes with correct data', () => {
        const data = connectIndex.data();
        expect(data.visible).toBe(false);
        expect(data.stepNumber).toBe(1);
        expect(data.stepsRaw).toBeDefined();
    });

    test('copy method downloads contact flow', async () => {
        const mockCallFlow = { test: 'data' };
        store.dispatch.mockResolvedValue({
            CallFlow: mockCallFlow,
            FileName: 'test-flow.json'
        });

        const btn = { loading: false };
        mockComponent.copy(btn);

        await waitForAsync();

        expect(store.dispatch).toHaveBeenCalledWith('api/getContactFlow');
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

    test('importQuestions starts import process', async () => {
        const mockContactFlow = { QnaFile: 'test-questions.json' };
        const mockExamples = [
            { document: { href: 'https://example.com/test-questions.json' } }
        ];
        const mockImportData = { qna: [{ q: 'test', a: 'answer' }] };
        const mockStartImport = { id: 'import-123' };
        const mockWaitResult = { href: 'https://example.com/status', status: 'Completed' };

        store.dispatch
            .mockResolvedValueOnce(mockContactFlow) // getContactFlow
            .mockResolvedValueOnce(mockExamples) // listExamples
            .mockResolvedValueOnce(mockImportData) // getImport
            .mockResolvedValueOnce(mockStartImport) // startImport
            .mockResolvedValueOnce(mockWaitResult) // waitForImport
            .mockResolvedValueOnce(mockWaitResult) // getImport (poll)
            .mockResolvedValue({}); // build

        const btn = { loading: false };
        const btnImportQuestions = { disabled: false, style: { opacity: '1' }, innerText: '' };
        const ImportQuestionsStatus = { innerText: '' };

        global.document.getElementById = vi.fn((id) => {
            if (id === 'ImportQuestions') return btnImportQuestions;
            if (id === 'ImportQuestionsStatus') return ImportQuestionsStatus;
            if (id === 'stsLabel') return { innerText: '' };
            return { innerText: '' };
        });

        mockComponent.importQuestions(btn);

        await waitForAsync(200);

        expect(store.dispatch).toHaveBeenCalledWith('api/getContactFlow');
        expect(store.dispatch).toHaveBeenCalledWith('api/listExamples');
    });
});

