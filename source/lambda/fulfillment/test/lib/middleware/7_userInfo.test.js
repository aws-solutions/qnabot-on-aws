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

const userInfo = require('../../../lib/middleware/7_userInfo');
const awsMock = require('aws-sdk-client-mock');
require('aws-sdk-client-mock-jest')
const logging = require('qnabot/logging')
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const dynamoDbMock = awsMock.mockClient(DynamoDBDocumentClient);
const originalEnv = process.env;
jest.mock('qnabot/logging');

describe('when calling userInfo function', () => {
    beforeEach(() => {
        dynamoDbMock.reset();
        process.env = {
            ...originalEnv,
            DYNAMODB_USERSTABLE: 'mock_user_table'
        };
    });

    test('should update user info in dynamoDB as per response object', async () => {
        const res = {
            "_userInfo": {
                "recentTopics": [{ "dateTime": "2023-10-05T16:34:57.656Z", "topic": "Astro" },
                { "dateTime": "2023-10-05T04:15:50.296Z", "topic": "Soap" }],
                "UserName": "testUser",
                "isVerifiedIdentity": "true",
            }
        }
        await userInfo({}, res);
        expect(dynamoDbMock).toHaveReceivedCommandWith(PutCommand, {
            "Item": {
                "UserId": "testUser", "UserName": "testUser", "isVerifiedIdentity": "true",
                "recentTopics": [{ "dateTime": "2023-10-05T16:34:57.656Z", "topic": "Astro" },
                { "dateTime": "2023-10-05T04:15:50.296Z", "topic": "Soap" }]
            },
            "TableName": process.env.DYNAMODB_USERSTABLE
        });
    });

    test('verify user info update in DB when isVerifiedIdentity is false', async () => {
        const res = {
            "_userInfo": {
                "recentTopics": [{ "dateTime": "2023-10-05T16:34:57.656Z", "topic": "Astro" },
                { "dateTime": "2023-10-05T04:15:50.296Z", "topic": "Soap" }],
                "UserName": "testUser",
                "UserId": "testUserId",
                "isVerifiedIdentity": "false",
            }
        }
        const result = await userInfo({}, res);
        expect(result.res._userInfo.UserId).toEqual("testUserId");
        expect(dynamoDbMock).toHaveReceivedCommandWith(PutCommand, {
            "Item": {
                "UserId": "testUserId", "UserName": "testUser", "isVerifiedIdentity": "false",
                "recentTopics": [{ "dateTime": "2023-10-05T16:34:57.656Z", "topic": "Astro" },
                { "dateTime": "2023-10-05T04:15:50.296Z", "topic": "Soap" }]
            },
            "TableName": process.env.DYNAMODB_USERSTABLE
        });
    });

    test('when dynamoDB put command fails, should log error', async () => {
        const res = {
            "_userInfo": {
                "recentTopics": [{ "dateTime": "2023-10-05T16:34:57.656Z", "topic": "Astro" },
                { "dateTime": "2023-10-05T04:15:50.296Z", "topic": "Soap" }],
                "UserName": "testUser",
                "UserId": "testUser",
                "isVerifiedIdentity": "true",
            }
        }
        dynamoDbMock.on(PutCommand).rejects('mocked DBB error');
        await userInfo({}, res);
        expect(dynamoDbMock).toHaveReceivedCommandWith(PutCommand, {
            "Item": {
                "UserId": "testUser", "UserName": "testUser", "isVerifiedIdentity": "true",
                "recentTopics": [{ "dateTime": "2023-10-05T16:34:57.656Z", "topic": "Astro" },
                { "dateTime": "2023-10-05T04:15:50.296Z", "topic": "Soap" }]
            },
            "TableName": "mock_user_table"
        });
        expect(logging.log).toHaveBeenNthCalledWith(4, "DDB Response: ", undefined)
    });
});