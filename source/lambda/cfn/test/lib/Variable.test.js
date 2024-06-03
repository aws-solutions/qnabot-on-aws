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

const originalEnv = process.env;
const variableFixtures = require('./Variable.fixtures');
const variable = require('../../lib/Variable');

describe('test S3Version class', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be able to get create CFN variables on Create", async () => {
        const variableCut = new variable();
        const params = variableFixtures.s3BucketObject();

        const callback = (error, result, original) => {
            expect(result).toBeDefined(); // It will return a base64 sha256 string
        };

        await variableCut.Create(params, callback);
    });


    it("should be equivalent to Create when Update is called", async () => {
        const variableCut = new variable();
        const params = variableFixtures.s3BucketObject();
        
        const callback = (error, result) => {
            expect(result).toBeDefined(); // It will return a base64 sha256 string
        };

        await variableCut.Update('mock_id', params, {}, callback);
    });
})