/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const region = process.env.AWS_REGION || 'us-east-1';
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const customSdkConfig = require('sdk-config/customSdkConfig');
const status = require('./statusv2');

const lambda = new LambdaClient(customSdkConfig('C002',
    {
        region,
        httpOptions: {
            timeout: 900000, // time to wait for a response
        },
    }));

module.exports = async function (qidsandquestions) {
    const functionName = process.env.LEXV2_BUILD_LAMBDA;
    const bucket = process.env.STATUS_BUCKET;
    const lexV2StatusFile = process.env.LEXV2_STATUS_KEY;
    const qidsandquestions_list = await qidsandquestions;
    console.log(`Invoking ${functionName} with Qids and Questions: ${JSON.stringify(qidsandquestions_list)}`);
    status('Starting LexV2 bot function');
    const params = {
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(
            {
                statusFile: { Bucket: bucket, Key: lexV2StatusFile },
                items: qidsandquestions_list,
            },
        ),
    }
    const invokeCmd = new InvokeCommand(params)
    const result = await lambda.send(invokeCmd);
    console.log(`LexV2 bot lambda result:${JSON.stringify(result)}`);
    if (result.FunctionError) {
        console.log('Error Response');
        throw result;
    }
    return result;
};
