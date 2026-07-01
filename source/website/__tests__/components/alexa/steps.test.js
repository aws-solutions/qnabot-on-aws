/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect } from 'vitest';
import steps from '../../../js/components/alexa/steps.js';

describe('alexa/steps', () => {
    test('exports an array of steps', () => {
        expect(Array.isArray(steps)).toBe(true);
        expect(steps.length).toBeGreaterThan(0);
    });

    test('each step has required properties', () => {
        steps.forEach((step, index) => {
            expect(step).toHaveProperty('title');
            expect(step).toHaveProperty('text');
            expect(typeof step.title).toBe('string');
            expect(typeof step.text).toBe('string');
            expect(step.title.length).toBeGreaterThan(0);
        });
    });

    test('steps include expected titles', () => {
        const titles = steps.map(step => step.title);
        expect(titles).toContain('Sign-in');
        expect(titles).toContain('Create');
        expect(titles).toContain('Model');
        expect(titles).toContain('Template');
        expect(titles).toContain('Review');
        expect(titles).toContain('Skill Lambda');
        expect(titles).toContain('Schema');
        expect(titles).toContain('Test');
    });

    test('Skill Lambda step has buttons', () => {
        const lambdaStep = steps.find(step => step.title === 'Skill Lambda');
        expect(lambdaStep).toBeDefined();
        expect(lambdaStep.buttons).toBeDefined();
        expect(Array.isArray(lambdaStep.buttons)).toBe(true);
        expect(lambdaStep.buttons[0]).toHaveProperty('text', 'COPY LAMBDA ARN');
        expect(lambdaStep.buttons[0]).toHaveProperty('id', 'LambdaArn');
    });

    test('Schema step has buttons', () => {
        const schemaStep = steps.find(step => step.title === 'Schema');
        expect(schemaStep).toBeDefined();
        expect(schemaStep.buttons).toBeDefined();
        expect(Array.isArray(schemaStep.buttons)).toBe(true);
        expect(schemaStep.buttons[0]).toHaveProperty('text', 'COPY SCHEMA');
        expect(schemaStep.buttons[0]).toHaveProperty('id', 'Schema');
    });

    test('steps with images have valid image paths', () => {
        steps.forEach((step) => {
            if (step.image) {
                expect(typeof step.image).toBe('string');
                expect(step.image).toMatch(/\.(png|jpg|jpeg|gif)$/i);
            }
        });
    });
});
