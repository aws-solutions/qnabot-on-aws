/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect } from 'vitest';
import textSchema from '../../../js/lib/schemas/text.js';

describe('schemas/text', () => {
    test('exports a valid schema object', () => {
        expect(textSchema).toBeDefined();
        expect(textSchema.type).toBe('object');
        expect(textSchema.description).toBe('Text passage');
    });

    test('has required properties', () => {
        expect(textSchema.required).toEqual(['qid', 'passage']);
    });

    test('qid property has correct structure', () => {
        const qid = textSchema.properties.qid;
        expect(qid.type).toBe('string');
        expect(qid.title).toBe('Item ID');
        expect(qid.maxLength).toBe(100);
    });

    test('passage property has correct structure', () => {
        const passage = textSchema.properties.passage;
        expect(passage.type).toBe('string');
        expect(passage.title).toBe('Passage');
        expect(passage.maxLength).toBe(8000);
    });

    test('has session attributes structure', () => {
        const sa = textSchema.properties.sa;
        expect(sa.type).toBe('array');
        expect(sa.items.properties.text).toBeDefined();
        expect(sa.items.properties.value).toBeDefined();
    });

    test('has response card structure', () => {
        const r = textSchema.properties.r;
        expect(r.type).toBe('object');
        expect(r.required).toContain('title');
    });

    test('has kendra redirect properties', () => {
        expect(textSchema.properties.kendraRedirectQueryText).toBeDefined();
        expect(textSchema.properties.kendraRedirectQueryConfidenceThreshold).toBeDefined();
    });

    test('has lambda hook properties', () => {
        expect(textSchema.properties.l).toBeDefined();
        expect(textSchema.properties.args).toBeDefined();
    });
});
