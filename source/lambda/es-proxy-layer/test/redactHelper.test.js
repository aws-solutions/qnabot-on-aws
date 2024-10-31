/** ************************************************************************************************
 *   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
 *   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const qnabot = require('qnabot/logging');
const { processKeysForRedact } = require('../lib/redactHelper');

describe('processKeysForRedact', () => {
    const redactedToken = '<token redacted>';

    beforeEach(() => {
        jest.spyOn(qnabot, 'redact_text').mockImplementation((text) => 'XXXXXX');
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('should redact token keys', () => {
        const obj = { token: 'secret', otherKey: 'value' };
        processKeysForRedact(obj, false);
        expect(obj).toEqual({ token: redactedToken, otherKey: 'value' });
    });

    test('should not redact excluded keys', () => {
        const obj = { ENABLE_TEST: true, FirstSeen: 'date', LastSeen: 'date', otherKey: 'value' };
        processKeysForRedact(obj, true);
        expect(obj).toEqual({ ENABLE_TEST: true, FirstSeen: 'date', LastSeen: 'date', otherKey: 'XXXXXX' });
    });

    test('should redact string values when fullRedaction is true', () => {
        const obj = { key1: 'PII1', key2: 'PII2' };
        processKeysForRedact(obj, true);
        expect(obj).toEqual({ key1: 'XXXXXX', key2: 'XXXXXX' });
    });

    test('should not redact non-string values when fullRedaction is true', () => {
        const obj = { num: 42, bool: true, nullValue: null, undefinedValue: undefined };
        processKeysForRedact(obj, true);
        expect(obj).toEqual({ num: 42, bool: true, nullValue: null, undefinedValue: undefined });
    });

    test('should process nested objects and arrays', () => {
        const obj = {
            nested: {
                key: 'value',
                token: 'secret',
                arr: [{ key: 'value' }, { token: 'secret' }]
            }
        };
        processKeysForRedact(obj, true);
        expect(obj).toEqual({
            nested: {
                key: 'XXXXXX',
                token: redactedToken,
                arr: [{ key: 'XXXXXX' }, { token: redactedToken }]
            }
        });
    });
});
