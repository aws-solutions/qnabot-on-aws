/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

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