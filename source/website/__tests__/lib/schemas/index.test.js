/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect } from 'vitest';
import schemas from '../../../js/lib/schemas/index.js';
import qna from '../../../js/lib/schemas/qna.js';
import text from '../../../js/lib/schemas/text.js';
import quiz from '../../../js/lib/schemas/quiz.js';
import slottype from '../../../js/lib/schemas/slottype.js';

describe('schemas/index', () => {
    test('exports all schema types', () => {
        expect(schemas).toBeDefined();
        expect(schemas.qna).toBeDefined();
        expect(schemas.text).toBeDefined();
        expect(schemas.quiz).toBeDefined();
        expect(schemas.slottype).toBeDefined();
    });

    test('schema objects have expected structure', () => {
        expect(typeof schemas.qna).toBe('object');
        expect(typeof schemas.text).toBe('object');
        expect(typeof schemas.quiz).toBe('object');
        expect(typeof schemas.slottype).toBe('object');
    });

    test('exports match individual schema imports', () => {
        expect(schemas.qna).toBe(qna);
        expect(schemas.text).toBe(text);
        expect(schemas.quiz).toBe(quiz);
        expect(schemas.slottype).toBe(slottype);
    });
});
