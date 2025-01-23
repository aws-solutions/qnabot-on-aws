/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { PutCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async event => {

    // Set TTL for 2 hours from now (in seconds)
    const TWO_HOURS_IN_SECONDS = 7200;
    const ttlTime = Math.floor(Date.now() / 1000 + TWO_HOURS_IN_SECONDS);

    const command = new PutCommand({
        TableName: process.env.STREAMING_TABLE,
        Item: {
            connectionId: event.requestContext.connectionId,
            sessionId: event.queryStringParameters.sessionId,
            ttl: ttlTime
        }
    });
    
    try {
        await docClient.send(command);
        console.log('Connected to WebSocket');
        return { statusCode: 200, body: 'Connected to WebSocket' };
    } catch (err) {
        console.log(err);
        return { statusCode: 500, body: `Failed to connect: ${err.name} ${err.message.substring(0, 500)}` };
    }
};