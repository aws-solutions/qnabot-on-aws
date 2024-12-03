/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const osWarmer = new (require('../../lib'))();
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
        const response = await osWarmer.perform(mockEvent);
        expect(requestsSpy).toBeCalledTimes(4);
        expect(response).toEqual("success");
    });

    test('when ES query returns error, should return failure', async () => {
        const requestsSpyError = jest.spyOn(NodeHttpHandler.prototype, 'handle')
            .mockImplementation((request) => {
                throw new Error("Mock Error");
            });
        const response = await osWarmer.perform(mockEvent);
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
        await osWarmer.perform(mockEvent);
        expect(logging.warn).toBeCalledWith("Unable to retrieve AWS access keys");
    });

});
