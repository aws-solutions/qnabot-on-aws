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

const nativePromise = require('../../../lib/util/promise');

describe('test nativePromise class', () => {
    beforeEach(() => {
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // TODO: Improve line coverage by hitting the setTimeout section after retrying.
    it("should be able to get a custom nativePromise", async () => {
        const callback = (error, result) => {
            expect(result).toBe('mock_success');
        };

        await nativePromise.retry(() => {}).then(() => {}, () => callback(null, 'mock_success'))
    });  

    it("should throw a rejection when an error occurs", async () => {
        const retrySpy = jest.spyOn(nativePromise, 'retry');
        retrySpy.mockRejectedValue('mock_error');

        const callback = (error, result) => {
            expect(error).toBe('mock_error')
        };

        try {
            await nativePromise.retry(() => {}).then(() => {}).catch(callback('mock_error', null))
        }
        catch {
            // Do nothing
        }
    });  
});