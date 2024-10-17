/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const customSdkConfig  = require('../../../lib/util/customSdkConfig');
const originalSolutionId = process.env.SOLUTION_ID;
const originalSolutionVersion = process.env.SOLUTION_VERSION;

describe('test customSdkConfig class', () => {
    beforeEach(() => {
        process.env.SOLUTION_ID = 'mock_id';
        process.env.SOLUTION_VERSION = 'mock_version';
    });

    afterEach(() => {
        process.env.SOLUTION_ID = originalSolutionId;
        process.env.SOLUTION_VERSION = originalSolutionVersion;
        jest.clearAllMocks();
    });

    it("should be able to create new API Deployment on Create", async () => {
        const sdkConfig = new customSdkConfig();

        expect(sdkConfig.customUserAgent[0]).toEqual(['AWSSOLUTION/mock_id/mock_version']);
        expect(sdkConfig.customUserAgent[1]).toEqual(['AWSSOLUTION-CAPABILITY/mock_id-C023/mock_version']);
    });  
});