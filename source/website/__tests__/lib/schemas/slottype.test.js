/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect } from 'vitest';
import slottypeSchema from '../../../js/lib/schemas/slottype.js';

describe('schemas/slottype', () => {
    test('exports a valid schema object', () => {
        expect(slottypeSchema).toBeDefined();
        expect(slottypeSchema.type).toBe('object');
        expect(slottypeSchema.description).toBe('SlotType documents');
    });

    test('has required qid property', () => {
        expect(slottypeSchema.required).toEqual(['qid']);
    });

    test('qid property has correct structure', () => {
        const qid = slottypeSchema.properties.qid;
        expect(qid.type).toBe('string');
        expect(qid.title).toBe('Slot type name');
        expect(qid.maxLength).toBe(100);
    });

    test('has description property', () => {
        const descr = slottypeSchema.properties.descr;
        expect(descr.type).toBe('string');
        expect(descr.title).toBe('Description');
        expect(descr.maxLength).toBe(200);
    });

    test('has resolution strategy property', () => {
        const resolutionStrategy = slottypeSchema.properties.resolutionStrategyRestrict;
        expect(resolutionStrategy.type).toBe('boolean');
        expect(resolutionStrategy.title).toBe('Restrict slot values - use only values provided');
    });

    test('has slot type values array', () => {
        const slotTypeValues = slottypeSchema.properties.slotTypeValues;
        expect(slotTypeValues.type).toBe('array');
        expect(slotTypeValues.items.type).toBe('object');
        expect(slotTypeValues.items.properties.samplevalue).toBeDefined();
        expect(slotTypeValues.items.properties.synonyms).toBeDefined();
    });

    test('slot type values have correct structure', () => {
        const items = slottypeSchema.properties.slotTypeValues.items;
        expect(items.properties.samplevalue.type).toBe('string');
        expect(items.properties.samplevalue.maxLength).toBe(140);
        expect(items.properties.synonyms.type).toBe('string');
    });
});
