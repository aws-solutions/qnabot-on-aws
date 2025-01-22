/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { PutCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { mockClient } = require('aws-sdk-client-mock');
const dynamoDbMock = mockClient(DynamoDBDocumentClient);
const { handler } = require('../index');
require('aws-sdk-client-mock-jest');

describe('WebSocket Connection Handler', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.STREAMING_TABLE = 'test-table';
        process.env.AWS_REGION = 'us-east-1';
        dynamoDbMock.reset();
    });

    test('should successfully store connection details', async () => {
        const mockDate = 1234567890000;
        jest.spyOn(Date, 'now').mockImplementation(() => mockDate);

        const event = {
            requestContext: {
                connectionId: 'test-connection-123'
            },
            queryStringParameters: {
                sessionId: 'test-session-123'
            }
        };

        dynamoDbMock.on(PutCommand).resolves({});
        const response = await handler(event);

        expect(response).toEqual({
            statusCode: 200,
            body: 'Connected to WebSocket'
        });


        expect(dynamoDbMock).toHaveReceivedCommandWith(PutCommand, {
            TableName: 'test-table',
            Item: {
                connectionId: 'test-connection-123',
                sessionId: 'test-session-123',
                ttl: mockDate / 1000 + 7200
            }
        });
    });

    test('should handle DynamoDB error', async () => {
        const event = {
            requestContext: {
                connectionId: 'test-connection-123'
            },
            queryStringParameters: {
                sessionId: 'test-session-123'
            }
        };

        const mockError = new Error('DynamoDB error');
        dynamoDbMock.on(PutCommand).rejects(mockError);

        const response = await handler(event);

        expect(response).toEqual({
            statusCode: 500,
            body: 'Failed to connect: Error DynamoDB error'
        });
    });


    test('should set correct TTL', async () => {
        const mockDate = 1234567890000;
        jest.spyOn(Date, 'now').mockImplementation(() => mockDate);

        const event = {
            requestContext: {
                connectionId: 'test-connection-123'
            },
            queryStringParameters: {
                sessionId: 'test-session-123'
            }
        };
        dynamoDbMock.on(PutCommand).resolves({});

        await handler(event);

        expect(dynamoDbMock).toHaveReceivedCommandWith(PutCommand, {
            Item: expect.objectContaining({
                ttl: mockDate / 1000 + 7200
            })
        });
    });
});
