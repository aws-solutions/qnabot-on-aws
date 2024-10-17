/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const base = require('../../lib/base');

describe('test base class', () => {  
    it("should be able to get default callback from Create", async () => {
        const baseCut = new base();
        
        const callback = (error, result, extraResult) => {
            expect(result).toBe('user');
        };

        await baseCut.Create({}, callback);
    });  

    it("should be able to get default callback from Update", async () => {
        const baseCut = new base();
        
        const callback = (error, result, extraResult) => {
            expect(result).toBe('mock_id');
        };

        await baseCut.Update('mock_id', {}, {}, callback);
    });  

    it("should be able to get default callback from Delete", async () => {
        const baseCut = new base();
        
        const callback = (error, result, extraResult) => {
            expect(result).toBe('mock_id');
        };

        await baseCut.Delete('mock_id', {}, callback);
    });  
});
