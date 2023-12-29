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

const fulfillment = require('../index');
const indexFixtures = require('./index.fixtures');
const warmer = new (require('../lib/warmer'))();
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
jest.mock('../lib/warmer');

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

    test('should successfully return request response', done => {
        function callback(error, data) {
            if (error) {
                done();
                return;
            }
            try {
                expect(data).toEqual(indexFixtures.mockResponse.out);
                done();
            } catch (error) {
                done(error);
            }
        }
        fulfillment.handler(indexFixtures.mockRequest, null, callback);
    });

    test('processing throws error and action is END', done => {
        function callback(error, data) {
            try {
                expect(error).toBe(null);
                done();
            }
            catch (error) {
                done(error);
            }
        };
        parse.mockImplementation(() => {
            throw {
                "action": "END",
                "error": "Mock error"
            };
        });
        fulfillment.handler(indexFixtures.mockRequest, null, callback);
    });

    test('processing throws error and action is RESPOND', done => {
        function callback(error, data) {
            try {
                expect(data).toBe("Test error message");
                done();
            }
            catch (error) {
                done(error);
            }
        };
        parse.mockImplementation(() => {
            throw {
                "action": "RESPOND",
                "message": "Test error message"
            };
        });
        fulfillment.handler(indexFixtures.mockRequest, null, callback);
    });

    test('processing throws generic error', done => {
        function callback(error, data) {
            try {
                expect(error).toEqual({
                    "error": "Test error"
                });
                done();
            }
            catch (error) {
                done(error);
            }
        };
        parse.mockImplementation(() => {
            throw {
                "error": "Test error"
            };
        });
        fulfillment.handler(indexFixtures.mockRequest, null, callback);
    });

});

describe('when calling lambda handler function', () => {
    test('processing throws error and action is END', async () => {
        warmer.perform.mockReturnValue(('success'));
        expect(await fulfillment.warmer({}, null, null)).toEqual("complete");
    });
});