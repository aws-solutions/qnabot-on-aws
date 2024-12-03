/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { LexModelBuildingServiceClient, GetBotCommand } = require('@aws-sdk/client-lex-model-building-service');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');

const region = process.env.AWS_REGION;
const lambda = new LambdaClient(customSdkConfig('C001', { region }));
const lex = new LexModelBuildingServiceClient(customSdkConfig('C001', { region }));
const s3 = new S3Client(customSdkConfig('C001', { region }));

const invokeLambda = async function invokeLambda(event) {
    return new Promise((res, rej) => {
        setTimeout(async () => {
            const params = {
                FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
                InvocationType: 'Event',
                Payload: JSON.stringify(event),
            };
            const invokeCmd = new InvokeCommand(params);
            await lambda.send(invokeCmd)
                .then((result) => {
                    res(result);
                })
                .catch((e) => {
                    console.log(e);
                    rej(e);
                });
        }, 2000);
    });
};

exports.handler = async function (event, context, callback) {
    try {
        const getObjCmd = new GetObjectCommand({
            Bucket: process.env.STATUS_BUCKET,
            Key: process.env.STATUS_KEY,
        });
        const s3Response = await s3.send(getObjCmd);
        const readableStream = Buffer.concat(await s3Response.Body.toArray());
        const status = JSON.parse(readableStream);

        const getBotCmd = new GetBotCommand({
            name: process.env.BOT_NAME,
            versionOrAlias: '$LATEST',
        });
        const lexResponse = await lex.send(getBotCmd);

        status.status = lexResponse.status;

        if (lexResponse.status === 'BUILDING') {
            await invokeLambda(event);
        }

        const params = {
            Bucket: process.env.STATUS_BUCKET,
            Key: process.env.STATUS_KEY,
            Body: JSON.stringify(status),
        };
        const putObjectCmd = new PutObjectCommand(params);
        await s3.send(putObjectCmd);
    } catch (error) {
        console.log('An error occurred in master lex-build: ', error);
        throw new Error(error.message);
    }
};
