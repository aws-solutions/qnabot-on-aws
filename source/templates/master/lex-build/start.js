/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');

const region = process.env.AWS_REGION;
const lambda = new LambdaClient(customSdkConfig('C002', { region }));
const s3 = new S3Client(customSdkConfig('C022', { region }));
const crypto = require('crypto');

exports.handler = async function (event, context) {
    const token = crypto.randomBytes(16).toString('base64');
    const bucket = process.env.STATUS_BUCKET;
    const lexV2StatusFile = process.env.LEXV2_STATUS_KEY;
    const functionName = process.env.BUILD_FUNCTION;
    const body = JSON.stringify({ status: 'Starting', token });

    console.log('Initializing ', bucket, lexV2StatusFile);
    const params = {
        Bucket: bucket,
        Key: lexV2StatusFile,
        Body: body,
    };
    const putObjectCmdV2 = new PutObjectCommand(params);
    await s3.send(putObjectCmdV2);

    // The BUILD_FUNCTION takes care of rebuilding Lex V2 bot
    console.log('Invoking ', functionName);
    const invokeParams = {
        FunctionName: functionName,
        InvocationType: 'Event',
        Payload: '{}',
    };
    const invokeCmd = new InvokeCommand(invokeParams);
    await lambda.send(invokeCmd);
    return { token };
};
