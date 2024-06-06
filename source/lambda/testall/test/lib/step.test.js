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
const load = require('../../lib/load');
const step = require('../../lib/step');
jest.mock('../../lib/load');

describe('when calling step function', () => {
    it('should call load function', async () => {

        const config = {scroll_id: '123'};
        const expectedBody = {
            endpoint: process.env.ES_ENDPOINT,
            method: 'POST',
            path: '_search/scroll',
            body: { 
                scroll: '1m',
                scroll_id: config.scroll_id
            }
        };
        await step(config);
        expect(load).toHaveBeenCalledWith(config, expectedBody);
      
    });

    it('should throw an error if load fails', async () => {

        const config = {scroll_id: '123'};
        const error = new Error('load failed');
        load.mockRejectedValue(error);
        await expect(step(config)).rejects.toThrowError(error);
    });
});
