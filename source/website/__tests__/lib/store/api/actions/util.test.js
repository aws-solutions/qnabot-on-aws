/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { getUserAgentString } from "../../../../../js/capability/util";

describe("getUserAgentString", () => {
    test('Returns the correct user agent string', () => {
        const version = '9.9.9';
        const capability = 'CTEST';
        const userAgent = getUserAgentString(version, capability);
        expect(userAgent).toEqual([
            [`AWSSOLUTION/SO0189/v${version}`],
            [`AWSSOLUTION-CAPABILITY/SO0189-${capability}/v${version}`],
        ]);
    });
});
