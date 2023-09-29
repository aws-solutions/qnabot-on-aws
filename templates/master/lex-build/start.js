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

const aws = require('aws-sdk');

aws.config.region = process.env.AWS_REGION;
const lambda = new aws.Lambda();
const s3 = new aws.S3();
const crypto = require('crypto');

exports.handler = async function (event, context, callback) {
    const token = crypto.randomBytes(16).toString('base64');
    const bucket = process.env.STATUS_BUCKET;
    const lexV1StatusFile = process.env.STATUS_KEY;
    const lexV2StatusFile = process.env.LEXV2_STATUS_KEY;
    const functionName = process.env.BUILD_FUNCTION;
    const body = JSON.stringify({ status: 'Starting', token });

    if (lexV1StatusFile) {
        console.log('Initializing ', bucket, lexV1StatusFile);
        await s3.putObject({
            Bucket: bucket,
            Key: lexV1StatusFile,
            Body: body,
        }).promise();
    }

    console.log('Initializing ', bucket, lexV2StatusFile);
    await s3.putObject({
        Bucket: bucket,
        Key: lexV2StatusFile,
        Body: body,
    }).promise();

    // The BUILD_FUNCTION takes care of rebuilding Lex V2 bot, and (unless QnABot is set to V2 only) Lex V1 bot
    console.log('Invoking ', functionName);
    await lambda.invoke({
        FunctionName: functionName,
        InvocationType: 'Event',
        Payload: '{}',
    }).promise();

    callback(null, { token });
};
