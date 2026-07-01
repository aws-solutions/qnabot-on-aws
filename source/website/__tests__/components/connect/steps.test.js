/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect } from 'vitest';
import steps from '../../../js/components/connect/steps.js';

describe('connect/steps', () => {
    test('exports an array of steps', () => {
        expect(Array.isArray(steps)).toBe(true);
        expect(steps.length).toBeGreaterThan(0);
    });

    test('each step has required properties', () => {
        steps.forEach((step) => {
            expect(step).toHaveProperty('title');
            expect(step).toHaveProperty('text');
            expect(typeof step.title).toBe('string');
            expect(typeof step.text).toBe('string');
        });
    });

    test('steps include Connect-specific content', () => {
        const allText = steps.map(step => step.text).join(' ');
        expect(allText).toMatch(/connect/i);
    });

    test('steps with images have valid image paths', () => {
        steps.forEach((step) => {
            if (step.image) {
                expect(typeof step.image).toBe('string');
                expect(step.image).toMatch(/\.(png|jpg|jpeg|gif)$/i);
            }
        });
    });

    test('steps with buttons have valid button structure', () => {
        steps.forEach((step) => {
            if (step.buttons) {
                expect(Array.isArray(step.buttons)).toBe(true);
                step.buttons.forEach((button) => {
                    expect(button).toHaveProperty('text');
                    expect(button).toHaveProperty('id');
                    expect(typeof button.text).toBe('string');
                    expect(typeof button.id).toBe('string');
                });
            }
        });
    });
});
