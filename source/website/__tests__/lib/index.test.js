/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect, vi } from 'vitest';

vi.mock('../../js/lib/router', () => ({}));
vi.mock('../../js/lib/store', () => ({}));

// Import after mocks are set up
const indexModule = await import('../../js/lib/index');

describe('lib js index module', () => {
    test('it exists', () => {
        expect(indexModule).toBeDefined();
    });
});
