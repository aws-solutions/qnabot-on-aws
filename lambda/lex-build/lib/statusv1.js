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

const region = process.env.AWS_REGION || 'us-east-1';
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');
const s3 = new S3Client(customSdkConfig('C001', { region }));

module.exports=async function(status,message){
    const bucket=process.env.STATUS_BUCKET;
    const lexV1StatusFile=process.env.STATUS_KEY;
    try {
        const res = await s3.send(new GetObjectCommand({
            Bucket:bucket,
            Key:lexV1StatusFile,
        }))
        const readableStream = Buffer.concat(await res.Body.toArray());
        const result = JSON.parse(readableStream);
        if(message) result.message=message;
        result.status=status;
        console.log(result);
        const params = {
            Bucket:bucket,
            Key:lexV1StatusFile,
            Body:JSON.stringify(result)
        }
        await s3.send(new PutObjectCommand(params))

    } catch (error) {
        console.error("An error occured in statusv1: ", error)
        throw new Error(error)
    }
};
