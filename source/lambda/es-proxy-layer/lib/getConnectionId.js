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

const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const region = process.env.AWS_REGION || 'us-east-1';
const client = new DynamoDBClient({ region });
const qnabot = require('qnabot/logging');

async function getConnectionId(sessionId, tableName) {
    const params = {
        Key: {
          sessionId: {
            S: sessionId
          },
        },
        TableName: tableName,
      };

    try {
        const command = new GetItemCommand(params);
        const dbResponse = await client.send(command);

        if (!dbResponse.Item) {
            throw new Error('Item not found');
        }

        const connectionId = dbResponse.Item.connectionId.S;
        qnabot.log(`Found donnectionId ${connectionId}`);

        return connectionId;
    } catch (error) {
        qnabot.log(`Error getting connectionId ${error.name}: ${error.message.substring(0, 500)}`);
    }
}

module.exports = { getConnectionId };
