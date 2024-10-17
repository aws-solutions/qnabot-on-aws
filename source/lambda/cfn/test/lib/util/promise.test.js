/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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