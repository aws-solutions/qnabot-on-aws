/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect } from 'vitest';
import getters from '../../../js/lib/store/getters.js';

describe('store/getters', () => {
    test('exports getters object', () => {
        expect(getters).toBeDefined();
        expect(typeof getters).toBe('object');
    });

    test('all getters are functions', () => {
        Object.values(getters).forEach((getter) => {
            expect(typeof getter).toBe('function');
        });
    });
});
