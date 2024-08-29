/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');

const region = process.env.AWS_REGION;
const lambda = new LambdaClient(customSdkConfig('C002', { region }));
const s3 = new S3Client(customSdkConfig('C022', { region }));
const crypto = require('crypto');

exports.handler = async function (event, context, callback) {
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
    callback(null, { token });
};
