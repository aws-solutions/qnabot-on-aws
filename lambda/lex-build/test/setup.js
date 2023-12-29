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

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const config=require('../../../config.json')

const outputs=require('../../../bin/exports')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { fromEnv } = require('@aws-sdk/credential-providers');
const region = config.region
const s3 = new S3Client({ region })

module.exports= async function(event){
    const credentials = fromEnv()
    process.env.AWS_ACCESS_KEY_ID=credentials.accessKeyId
    process.env.AWS_SECRET_ACCESS_KEY=credentials.secretAccessKey
    process.env.AWS_REGION=config.region

    process.env.SALT='salt'
    const envs=await outputs('dev/bucket',{wait:true})
    process.env.UTTERANCE_BUCKET=envs.Bucket
    process.env.STATUS_BUCKET=envs.Bucket
    process.env.STATUS_KEY="status.json"
    process.env.UTTERANCE_KEY="utterances.json"

    await s3.send(new PutObjectCommand({
        Bucket:process.env.UTTERANCE_BUCKET,
        Key:process.env.UTTERANCE_KEY,
        Body:JSON.stringify(["a","b"])
    }))
    await s3.send(new PutObjectCommand({
        Bucket:process.env.STATUS_BUCKET,
        Key:"status.json",
        Body:JSON.stringify({})
    }))

    await require('../index.js').handler(event,{})
    return true
}


