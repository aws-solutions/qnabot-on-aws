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
