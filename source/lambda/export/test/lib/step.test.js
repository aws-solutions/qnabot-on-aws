 /** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
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