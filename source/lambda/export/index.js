/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { S3Client, GetObjectCommand, PutObjectCommand, waitUntilObjectExists } = require('@aws-sdk/client-s3');
const region = process.env.AWS_REGION;
const customSdkConfig = require('sdk-config/customSdkConfig');
const s3 = new S3Client(customSdkConfig('C011', { region }));
const _ = require('lodash');
const start = require('./lib/start');
const step = require('./lib/step');
const join = require('./lib/join');
const clean = require('./lib/clean');

const outputBucket = process.env.OUTPUT_S3_BUCKET;
const step_status_ignore = ['Error', 'Completed', 'Sync Complete', 'Parsing content JSON', 'Creating FAQ']

exports.step=async function(event,context,cb){
    console.log('Initiating Export')
    console.log('Request',JSON.stringify(event,null,2))
    const inputBucket=event.Records[0].s3.bucket.name
    const Key=decodeURI(event.Records[0].s3.object.key)
    const initialVersionId=_.get(event,'Records[0].s3.object.versionId')
    try {
        const startResult = await getStatusAndStartNextStep(inputBucket, Key, initialVersionId, start);
        const stepResult = await getStatusAndStartNextStep(outputBucket, Key, startResult.VersionId, step);
        const joinResult = await getStatusAndStartNextStep(outputBucket, Key, stepResult.VersionId, join);
        await getStatusAndStartNextStep(outputBucket, Key, joinResult.VersionId, clean);
    } 
    catch (error) {
        console.error("An error occured in S3 operations: ", error)
        cb(error)
    }
}

async function getStatusAndStartNextStep(Bucket, Key, VersionId, nextStep) {
    await waitUntilObjectExists({
        client: s3,
        maxWaitTime: 10
    }, {Bucket,Key,VersionId})
    const res = await s3.send(new GetObjectCommand({Bucket,Key,VersionId}))
    const readableStream = Buffer.concat(await res.Body.toArray());
    const config = JSON.parse(readableStream);
    if (step_status_ignore.includes(config.status)===false) {
        try {
            console.log(config.status)
            console.log('Config:',JSON.stringify(config,null,2))
            await nextStep(config);        
        } catch (err) {
            console.log(err)
            config.status='Error'
            config.message=_.get(err,'message',JSON.stringify(err))
        }
        const putObjOutput = await s3.send(new PutObjectCommand({Bucket: outputBucket , Key, Body:JSON.stringify(config)}));
        console.log('putObjOutput', JSON.stringify(putObjOutput, null, 2))
        return putObjOutput;
    }
}
