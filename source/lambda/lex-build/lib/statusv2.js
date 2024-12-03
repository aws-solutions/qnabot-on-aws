/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const region = process.env.AWS_REGION || 'us-east-1';
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');
const s3 = new S3Client(customSdkConfig('C002', { region }));

module.exports=async function(status,message){
    const bucket = process.env.STATUS_BUCKET;
    const lexV2StatusFile = process.env.LEXV2_STATUS_KEY;
    try {
        const res = await s3.send(new GetObjectCommand({
            Bucket:bucket,
            Key:lexV2StatusFile,
        }))
        const readableStream = Buffer.concat(await res.Body.toArray());
        const result = JSON.parse(readableStream);
        if(message) result.message=message;
        result.status=status;
        console.log(result);
        const params = {
            Bucket:bucket,
            Key:lexV2StatusFile,
            Body:JSON.stringify(result)
        }
        const putObjCmd = new PutObjectCommand(params)
        await s3.send(putObjCmd);

    } catch (error) {
        console.error("An error occured in statusv2: ", error)
        throw new Error(error)
    }
};
