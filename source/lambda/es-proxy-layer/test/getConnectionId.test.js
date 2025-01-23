/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { getConnectionId } = require('../lib/getConnectionId');
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { mockClient } = require('aws-sdk-client-mock');
const ddbMock = mockClient(DynamoDBClient);
require('aws-sdk-client-mock-jest');

describe('getConnectionId', () => {
    const mockSessionId = 'test-session-123';
    const mockTableName = 'test-table';
    
    beforeEach(() => {
        jest.clearAllMocks();
        ddbMock.reset();
    });

    test('should successfully retrieve connectionId', async () => {
        const mockResponse = {
            Item: {
                connectionId: {
                    S: 'test-connection-id'
                }
            }
        };

        const expectedCall = {
            TableName: mockTableName,
            Key: {
                sessionId: {
                    S: mockSessionId
                }
            }
        };

        ddbMock.on(GetItemCommand).resolves(mockResponse);

        const result = await getConnectionId(mockSessionId, mockTableName);

        expect(result).toBe('test-connection-id');
        expect(ddbMock).toHaveReceivedCommandWith(GetItemCommand, expectedCall);

    });

    test('should handle item not found', async () => {
        const mockResponse = {
            Item: null
        };

        ddbMock.on(GetItemCommand).resolves(mockResponse);

        const result = await getConnectionId(mockSessionId, mockTableName);

        expect(result).toBeUndefined();
    });

    test('should handle DynamoDB error', async () => {
        const mockError = new Error('DynamoDB error');
        DynamoDBClient.prototype.send = jest.fn().mockRejectedValue(mockError);

        const result = await getConnectionId(mockSessionId, mockTableName);

        expect(result).toBeUndefined();
    });

    test('should handle empty parameters', async () => {
        const result = await getConnectionId(null, null);
        expect(result).toBeUndefined();
    });

});
