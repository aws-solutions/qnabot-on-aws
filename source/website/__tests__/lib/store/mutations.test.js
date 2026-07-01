/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect } from 'vitest';
import mutations from '../../../js/lib/store/mutations.js';

describe('store/mutations', () => {
    test('info mutation sets state.info', () => {
        const state = { info: {} };
        const payload = {
            Version: '1.0.0',
            BuildDate: '2024-01-01',
            _links: { test: 'value' },
        };

        mutations.info(state, payload);

        expect(state.info).toEqual(payload);
    });

    test('captureHash mutation captures location hash', () => {
        const state = { hash: '' };
        const originalLocation = window.location;
        
        delete window.location;
        window.location = { hash: '#test-hash' };

        mutations.captureHash(state);

        expect(state.hash).toBe('test-hash');
        
        window.location = originalLocation;
    });

    test('bot mutation sets state.bot and preserves utterances', () => {
        const state = {
            bot: {
                utterances: ['existing', 'utterances'],
            },
        };
        const payload = {
            name: 'TestBot',
            version: '1.0',
        };

        mutations.bot(state, payload);

        expect(state.bot.name).toBe('TestBot');
        expect(state.bot.version).toBe('1.0');
        expect(state.bot.utterances).toEqual(['existing', 'utterances']);
    });

    test('utterances mutation sets bot utterances', () => {
        const state = {
            bot: {
                utterances: [],
            },
        };
        const payload = ['new', 'utterances'];

        mutations.utterances(state, payload);

        expect(state.bot.utterances).toEqual(payload);
    });

    test('alexa mutation sets bot alexa property', () => {
        const state = {
            bot: {},
        };
        const payload = { alexaData: 'test' };

        mutations.alexa(state, payload);

        expect(state.bot.alexa).toEqual(payload);
    });

    test('setBotInfo mutation extracts lambda name from ARN', () => {
        const state = { bot: {} };
        const payload = {
            lambdaArn: 'arn:aws:lambda:us-east-1:123456789012:function:MyFunction',
            otherData: 'test',
        };

        mutations.setBotInfo(state, payload);

        expect(state.bot.lambdaName).toBe('MyFunction');
        expect(state.bot.lambdaArn).toBe(payload.lambdaArn);
        expect(state.bot.otherData).toBe('test');
    });

    test('setError mutation sets error message', () => {
        const state = { error: null };
        const errorMessage = 'Test error message';

        mutations.setError(state, errorMessage);

        expect(state.error).toBe(errorMessage);
    });

    test('clearError mutation clears error', () => {
        const state = { error: 'Some error' };

        mutations.clearError(state);

        expect(state.error).toBeNull();
    });

    test('mutations handle empty payloads', () => {
        const state = { info: {}, error: '' };

        mutations.info(state, {});
        expect(state.info).toEqual({});
    });
});
