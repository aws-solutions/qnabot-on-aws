/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const osWarmer = require('../index');
const warmer = new (require('../lib'))();

jest.mock('../lib');

describe('when calling lambda handler function', () => {
    test('processing throws error and action is END', async () => {
        warmer.perform.mockReturnValue(('success'));
        expect(await osWarmer.warmer({}, null, null)).toEqual("complete");
    });
});