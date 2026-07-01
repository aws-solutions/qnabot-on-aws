/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect } from 'vitest';
import quizSchema from '../../../js/lib/schemas/quiz.js';

describe('schemas/quiz', () => {
    test('exports a valid schema object', () => {
        expect(quizSchema).toBeDefined();
        expect(quizSchema.type).toBe('object');
        expect(quizSchema.description).toBe('Quiz documents');
    });

    test('has required qid property', () => {
        expect(quizSchema.required).toEqual(['qid']);
    });

    test('qid property has correct structure', () => {
        const qid = quizSchema.properties.qid;
        expect(qid.type).toBe('string');
        expect(qid.title).toBe('Quiz Question ID');
        expect(qid.maxLength).toBe(100);
    });

    test('question property has correct structure', () => {
        const question = quizSchema.properties.question;
        expect(question.type).toBe('string');
        expect(question.title).toBe('Question');
        expect(question.maxLength).toBe(140);
    });

    test('correctAnswers is an array', () => {
        const correctAnswers = quizSchema.properties.correctAnswers;
        expect(correctAnswers.type).toBe('array');
        expect(correctAnswers.items.type).toBe('string');
        expect(correctAnswers.items.maxLength).toBe(140);
    });

    test('incorrectAnswers is an array', () => {
        const incorrectAnswers = quizSchema.properties.incorrectAnswers;
        expect(incorrectAnswers.type).toBe('array');
        expect(incorrectAnswers.items.type).toBe('string');
    });

    test('has quiz ID property', () => {
        const quiz = quizSchema.properties.quiz;
        expect(quiz.type).toBe('string');
        expect(quiz.title).toBe('Quiz ID');
    });

    test('has responses structure', () => {
        const responses = quizSchema.properties.responses;
        expect(responses.type).toBe('object');
        expect(responses.properties.correct).toBeDefined();
        expect(responses.properties.incorrect).toBeDefined();
        expect(responses.properties.end).toBeDefined();
    });

    test('has next questions array', () => {
        const next = quizSchema.properties.next;
        expect(next.type).toBe('array');
        expect(next.items.type).toBe('string');
    });

    test('has response card structure', () => {
        const r = quizSchema.properties.r;
        expect(r.type).toBe('object');
        expect(r.required).toContain('title');
        expect(r.properties.buttons).toBeDefined();
    });
});
