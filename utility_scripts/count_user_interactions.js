#! /usr/bin/env node
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

(async () => {
    process.env.AWS_SDK_LOAD_CONFIG = true;
    const region = process.env.AWS_REGION;
    const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
    const dynamodb = new DynamoDBClient({ region });
    args = process.argv.slice(2);

    if (args.length != 1) {
        console.log('Must specify DynamoDB tablename');
        throw 'Must specify DynamoDB tablename';
    }

    const getAllData = async (params) => {
        const _getAllData = async (params, startKey) => {
            if (startKey) {
                params.ExclusiveStartKey = startKey;
            }
            const scanCmd = new ScanCommand(params);
            return dynamodb.send(scanCmd);
        };
        let lastEvaluatedKey = null;
        let rows = [];
        let count = 0;
        do {
            const result = await _getAllData(params, lastEvaluatedKey);
            count += result.Count;
            rows = rows.concat(result.Items);
            lastEvaluatedKey = result.LastEvaluatedKey;
        } while (lastEvaluatedKey);
        return { Rows: rows, Count: count };
    };

    const params = {

        ExpressionAttributeValues: {
            ':count': {
                N: '1',
            },
            ':seconds': {
                N: `${60 * 60 * 24 * 30}`,
            },
        },
        FilterExpression: 'InteractionCount > :count AND TimeSinceLastInteraction < :seconds',
        TableName: args[0],
        Select: 'COUNT',

    };
    const alldata = await getAllData(params);

    console.log(`Users with more than one interaction ${alldata.Count}`);
})();
