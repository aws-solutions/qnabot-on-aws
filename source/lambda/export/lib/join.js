/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');
const region = process.env.AWS_REGION;
const s3 = new S3Client(customSdkConfig('C011', { region }));

module.exports = async function(config){
    try {
        const parts =[];
        for (const part of config.parts){
            console.log(`getting part ${part.key}`);
            const params = {
                Bucket: config.bucket,
                Key: part.key,
                VersionId: config.version
            };
            const response = await s3.send(new GetObjectCommand(params));
            const readableStream = Buffer.concat(await response.Body.toArray());
            parts.push(readableStream);
        };
        const putParams = {
            Bucket:config.bucket,
            Key:config.key,
            Body:parts.join('\n')
        };
        await s3.send(new PutObjectCommand(putParams));
        config.status='Clean';
    } catch (error) {
        console.error("An error occurred while joining parts", error);
        throw error;
    }
}