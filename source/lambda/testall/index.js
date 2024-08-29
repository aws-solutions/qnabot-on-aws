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

const { S3Client, waitUntilObjectExists, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');
const region = process.env.AWS_REGION;
const s3 = new S3Client(customSdkConfig('C012', { region }));
const _ = require('lodash');
const start = require('./lib/start');
const step = require('./lib/step');
const lex = require('./lib/lex');
const clean = require('./lib/clean');

const outputBucket = process.env.OUTPUT_S3_BUCKET;

exports.step = async function (event, context, cb) {
    console.log('Initiating TestAll');
    console.log('Request', JSON.stringify(event, null, 2));
    const inputBucket = event.Records[0].s3.bucket.name;
    const Key = decodeURI(event.Records[0].s3.object.key);
    const initialVersionId = _.get(event, 'Records[0].s3.object.versionId');
    try {
        const startResult = await getStatusAndStartNextStep(inputBucket, Key, initialVersionId, start);
        const stepResult = await getStatusAndStartNextStep(outputBucket, Key, startResult.VersionId, step);
        const lexResult = await getStatusAndStartNextStep(outputBucket, Key, stepResult.VersionId, lex);
        await getStatusAndStartNextStep(outputBucket, Key, lexResult.VersionId, clean);
    } catch (error) {
        console.error('An error occured in S3 operations: ', error);
        cb(error);
    }
};

async function getStatusAndStartNextStep(Bucket, Key, VersionId, nextStep) {
    await waitUntilObjectExists({
        client: s3,
        maxWaitTime: 30
    }, { Bucket, Key, VersionId });
    const getObjCmd = new GetObjectCommand({ Bucket, Key, VersionId });
    const s3GetObj = await s3.send(getObjCmd);
    const readableStream = Buffer.concat(await s3GetObj.Body.toArray());
    const config = JSON.parse(readableStream);

    if (config.status !== 'Error' && config.status !== 'Completed') {
        try {
            const config_redacted = { ...config, token: 'REDACTED' };
            console.log('Config:', JSON.stringify(config_redacted, null, 2));
            await nextStep(config);
        } catch (err) {
            console.error('An error occured within the step '+config.status+': ', err);
            config.status = 'Error';
            config.message = _.get(err, 'message', JSON.stringify(err));
        }

        const putObjCmd = new PutObjectCommand({ Bucket: outputBucket, Key, Body: JSON.stringify(config) })
        const putObjOutput = await s3.send(putObjCmd);
        return putObjOutput;
    }

}