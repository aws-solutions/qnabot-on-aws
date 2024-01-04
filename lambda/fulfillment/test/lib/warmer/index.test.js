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

const esWarmer = new (require('../../../lib/warmer'))();
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const logging = require('qnabot/logging')
const originalEnv = process.env;
jest.mock('qnabot/logging');

const mockEvent = { "id": "testId" };

describe('when calling perform function', () => {

    beforeEach(() => {
        process.env = {
            ...originalEnv,
            REPEAT_COUNT: 4,
            TARGET_URL: "mock_url",
            TARGET_INDEX: "mock_index",
            TARGET_PATH: "_search",
            AWS_ACCESS_KEY_ID: "mock_key",
            AWS_SECRET_ACCESS_KEY: "mock_secret_key",
        }
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const requestsSpy = jest.spyOn(NodeHttpHandler.prototype, 'handle')
        .mockImplementation((request) => {
            return Promise.resolve({ response: { "body": ["mockResponse"] } });
        });

    test('when ES warmer query is successful, should return success', async () => {
        const response = await esWarmer.perform(mockEvent);
        expect(requestsSpy).toBeCalledTimes(4);
        expect(response).toEqual("success");
    });

    test('when ES query returns error, should return failure', async () => {
        const requestsSpyError = jest.spyOn(NodeHttpHandler.prototype, 'handle')
            .mockImplementation((request) => {
                throw new Error("Mock Error");
            });
        const response = await esWarmer.perform(mockEvent);
        console.log(`Response is ${response}`);
        expect(requestsSpyError).toBeCalledTimes(1);
        expect(response).toEqual("failure");
    });

    test('when credentials are not found in env', async () => {
        process.env = {
            ...originalEnv,
            REPEAT_COUNT: 4,
            TARGET_URL: "mock_url",
            TARGET_INDEX: "mock_index",
            TARGET_PATH: "_search",
            AWS_ACCESS_KEY_ID: null,
            AWS_SECRET_ACCESS_KEY: null,
        }
        await esWarmer.perform(mockEvent);
        expect(logging.warn).toBeCalledWith("Unable to retrieve AWS access keys");
    });

});
