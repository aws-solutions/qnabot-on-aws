/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect } from 'vitest';
import qnaSchema from '../../../js/lib/schemas/qna.js';

describe('schemas/qna', () => {
    test('exports a valid schema object', () => {
        expect(qnaSchema).toBeDefined();
        expect(qnaSchema.type).toBe('object');
        expect(qnaSchema.description).toBe('Question and Answer document');
    });

    test('has required properties defined', () => {
        expect(qnaSchema.properties).toBeDefined();
        expect(qnaSchema.properties.qid).toBeDefined();
        expect(qnaSchema.properties.q).toBeDefined();
        expect(qnaSchema.properties.a).toBeDefined();
    });

    test('has correct required fields', () => {
        expect(qnaSchema.required).toEqual(['qid', 'q', 'a']);
    });

    test('qid property has correct constraints', () => {
        const qid = qnaSchema.properties.qid;
        expect(qid.type).toBe('string');
        expect(qid.title).toBe('Item ID');
        expect(qid.maxLength).toBe(100);
    });

    test('q property is an array of strings', () => {
        const q = qnaSchema.properties.q;
        expect(q.type).toBe('array');
        expect(q.title).toBe('Questions / Utterances');
        expect(q.items.type).toBe('string');
        expect(q.items.maxLength).toBe(140);
    });

    test('a property has correct constraints', () => {
        const a = qnaSchema.properties.a;
        expect(a.type).toBe('string');
        expect(a.title).toBe('Answer');
        expect(a.maxLength).toBe(8000);
    });

    test('has alternate answers structure', () => {
        const alt = qnaSchema.properties.alt;
        expect(alt.type).toBe('object');
        expect(alt.properties.ssml).toBeDefined();
        expect(alt.properties.markdown).toBeDefined();
    });

    test('has response card structure', () => {
        const r = qnaSchema.properties.r;
        expect(r.type).toBe('object');
        expect(r.properties.title).toBeDefined();
        expect(r.properties.buttons).toBeDefined();
        expect(r.required).toContain('title');
    });

    test('has slots array structure', () => {
        const slots = qnaSchema.properties.slots;
        expect(slots.type).toBe('array');
        expect(slots.items.type).toBe('object');
        expect(slots.items.properties.slotName).toBeDefined();
        expect(slots.items.properties.slotType).toBeDefined();
    });

    test('has session attributes structure', () => {
        const sa = qnaSchema.properties.sa;
        expect(sa.type).toBe('array');
        expect(sa.items.type).toBe('object');
        expect(sa.items.properties.text).toBeDefined();
        expect(sa.items.properties.value).toBeDefined();
    });

    test('has lambda hook properties', () => {
        expect(qnaSchema.properties.l).toBeDefined();
        expect(qnaSchema.properties.args).toBeDefined();
        expect(qnaSchema.properties.l.title).toBe('Lambda Hook');
    });

    test('has kendra redirect properties', () => {
        expect(qnaSchema.properties.kendraRedirectQueryText).toBeDefined();
        expect(qnaSchema.properties.kendraRedirectQueryConfidenceThreshold).toBeDefined();
        expect(qnaSchema.properties.kendraRedirectQueryArgs).toBeDefined();
    });

    test('has bot routing structure', () => {
        const botRouting = qnaSchema.properties.botRouting;
        expect(botRouting.type).toBe('object');
        expect(botRouting.properties.specialty_bot).toBeDefined();
        expect(botRouting.properties.specialty_bot_name).toBeDefined();
    });

    test('has elicit response structure', () => {
        const elicitResponse = qnaSchema.properties.elicitResponse;
        expect(elicitResponse.type).toBe('object');
        expect(elicitResponse.properties.responsebot_hook).toBeDefined();
        expect(elicitResponse.properties.response_sessionattr_namespace).toBeDefined();
    });

    test('has additional optional properties', () => {
        expect(qnaSchema.properties.t).toBeDefined(); // topic
        expect(qnaSchema.properties.tags).toBeDefined();
        expect(qnaSchema.properties.rp).toBeDefined(); // reprompt
        expect(qnaSchema.properties.next).toBeDefined(); // guided navigation
        expect(qnaSchema.properties.conditionalChaining).toBeDefined();
        expect(qnaSchema.properties.clientFilterValues).toBeDefined();
    });
});
