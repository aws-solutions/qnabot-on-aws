/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect, vi } from 'vitest';
import gremlins from '../assets/gremlins.min';
import testModule from '../js/test';

describe('test test', () => {
    test('exec', () => {
        vi.spyOn(gremlins, 'createHorde').mockReturnValue({
            gremlin: vi.fn(),
            unleash: vi.fn(),
        });

        vi.spyOn(window.horde, 'unleash').mockImplementation(() => {});

        const documentSpy = vi.spyOn(document, 'getElementById')
            .mockReturnValueOnce({ hidden: false })
            .mockReturnValueOnce(undefined);

        window.start(false);
        window.start(true);

        expect(documentSpy).toHaveBeenCalledTimes(2);
    });
});
