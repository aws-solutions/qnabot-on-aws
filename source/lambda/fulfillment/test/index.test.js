/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const fulfillment = require('../index');
const indexFixtures = require('./index.fixtures');
const parse = require('../lib/middleware/1_parse');
const preprocess = require('../lib/middleware/2_preprocess');
const query = require('../lib/middleware/3_query');
const hook = require('../lib/middleware/4_hook');
const assemble = require('../lib/middleware/5_assemble');
const cache = require('../lib/middleware/6_cache');
const userInfo = require('../lib/middleware/7_userInfo');
jest.mock('../lib/middleware/1_parse');
jest.mock('../lib/middleware/2_preprocess');
jest.mock('../lib/middleware/3_query');
jest.mock('../lib/middleware/4_hook');
jest.mock('../lib/middleware/5_assemble');
jest.mock('../lib/middleware/6_cache');
jest.mock('../lib/middleware/7_userInfo');

describe('when calling lambda handler function', () => {
    beforeEach(() => {
        parse.mockReturnValue({ "req": indexFixtures.mockRequest, "res": indexFixtures.mockResponse });
        preprocess.mockReturnValue({ "req": indexFixtures.mockRequest, "res": indexFixtures.mockResponse });
        query.mockReturnValue({ "req": indexFixtures.mockRequest, "res": indexFixtures.mockResponse });
        hook.mockReturnValue({ "req": indexFixtures.mockRequest, "res": indexFixtures.mockResponse });
        assemble.mockReturnValue({ "req": indexFixtures.mockRequest, "res": indexFixtures.mockResponse });
        cache.mockReturnValue({ "req": indexFixtures.mockRequest, "res": indexFixtures.mockResponse });
        userInfo.mockReturnValue({ "req": indexFixtures.mockRequest, "res": indexFixtures.mockResponse });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should successfully return request response', async () => {
        const result = await fulfillment.handler(indexFixtures.mockRequest, null);
        expect(result).toEqual(indexFixtures.mockResponse.out);
    });

    test('processing throws error and action is END', async () => {
        parse.mockImplementation(() => {
            throw {
                "action": "END",
                "error": "Mock error"
            };
        });
        const result = await fulfillment.handler(indexFixtures.mockRequest, null);
        expect(result).toBe(null);
    });

    test('processing throws error and action is RESPOND', async () => {
        parse.mockImplementation(() => {
            throw {
                "action": "RESPOND",
                "message": "Test error message"
            };
        });
        const result = await fulfillment.handler(indexFixtures.mockRequest, null);
        expect(result).toBe("Test error message");
    });

    test('processing throws generic error', async () => {
        parse.mockImplementation(() => {
            throw {
                "error": "Test error"
            };
        });
        await expect(fulfillment.handler(indexFixtures.mockRequest, null)).rejects.toEqual({
            "error": "Test error"
        });
    });
    test('should skip middleware when _skipSteps and _skipSteps are set', async () => {

        preprocess.mockImplementation((req, res) => ({
            req: { 
                ...req,
                _skipSteps: 3
            },
            res: { ...res }
        }));
    
        const request = {
            _event: "mock event",
            _settings: {},
            _fulfillment: {},
        };
        
        const result = await fulfillment.handler(request, null);
        
        expect(parse).toHaveBeenCalled();
        expect(preprocess).toHaveBeenCalled();
        expect(query).not.toHaveBeenCalled();  // Query should be skipped
        expect(hook).not.toHaveBeenCalled();  // Hook should be skipped
        expect(assemble).toHaveBeenCalled();
        expect(cache).toHaveBeenCalled();
        expect(userInfo).toHaveBeenCalled();
        expect(result).toEqual(indexFixtures.mockResponse.out);
    });
    
    
    

    test('should not skip if _skipSteps is missing', async () => {
        const requestWithIncompleteSkip = {
            ...indexFixtures.mockRequest,
        };
        
        const result = await fulfillment.handler(requestWithIncompleteSkip, null);
        
        expect(parse).toHaveBeenCalled();
        expect(preprocess).toHaveBeenCalled();
        expect(query).toHaveBeenCalled();
        expect(hook).toHaveBeenCalled();
        expect(cache).toHaveBeenCalled();
        expect(userInfo).toHaveBeenCalled();
        expect(result).toEqual(indexFixtures.mockResponse.out);
    });

});