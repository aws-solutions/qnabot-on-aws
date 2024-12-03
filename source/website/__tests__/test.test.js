/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import gremlins from '../assets/gremlins.min';
const testModule = require('../js/test');

describe('test test', () => {
    test('exec', () => {
        jest.spyOn(gremlins, 'createHorde').mockReturnValue({
            gremlin: jest.fn(),
            unleash: jest.fn(),
        });

        jest.spyOn(window.horde, 'unleash').mockImplementation(() => {});

        const documentSpy = jest.spyOn(document, 'getElementById')
            .mockReturnValueOnce({ hidden: false })
            .mockReturnValueOnce(undefined);

        window.start(false);
        window.start(true);

        expect(documentSpy).toHaveBeenCalledTimes(2);
    });
});
