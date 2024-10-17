/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('./util/customSdkConfig');

const region = process.env.AWS_REGION || 'us-east-1';
const s3 = new S3Client(customSdkConfig({ region }));

async function waitForExport(oldS3Params, s3params, timeout) {
    console.log('Checking the status of export');
    const now = Date.now();
    const stoptime = now + timeout;
    let complete = false;
    let timedout = false;
    do {
        try {
            console.log(JSON.stringify(s3params));
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const res = await s3.send(new GetObjectCommand(s3params));
            const readableStream = Buffer.concat(await res.Body.toArray())
            const body = JSON.parse(readableStream);
            console.log(body.status);
            complete = (body.status == 'Completed');
            timedout = (Date.now() > stoptime);
        }
        catch(err){
            // Neccessary for backwards compatibility.
            if (err.name === 'AccessDenied') {
                console.log('Checking the status of export with outdated configuration.');
                console.log(JSON.stringify(oldS3Params));
                await new Promise((resolve) => setTimeout(resolve, 1000));
                const res = await s3.send(new GetObjectCommand(oldS3Params));
                const readableStream = Buffer.concat(await res.Body.toArray())
                const body = JSON.parse(readableStream);
                console.log(body.status);
                complete = (body.status == 'Completed');
                timedout = (Date.now() > stoptime);
            }   
        }
    } while (!complete && !timedout);
    if (!complete && timedout) {
        console.log('Timed out.');
    }
    return complete;
}

async function run_export(params) {
    const data = {
        bucket: params.bucket,
        index: params.index,
        id: params.id,
        config: `status-export/${params.id}`,
        tmp: `tmp/${params.id}`,
        key: `data-export/${params.id}`,
        filter: '',
        status: 'Started',
    };
    const oldS3Params = {
        Bucket: data.bucket,
        Key: `status/${params.id}`,
        Body: JSON.stringify(data),
    }
    const s3params = {
        Bucket: data.bucket,
        Key: data.config,
        Body: JSON.stringify(data),
    };
    const statusfile = `${data.bucket}/${data.config}`;
    console.log('Running content export as backup before upgrade.');
    // Create object in export bucket to trigger export lambda
    await s3.send(new PutObjectCommand(oldS3Params));
    await s3.send(new PutObjectCommand(s3params));
    console.log('Wait up to 60 seconds for status to be completed');
    delete oldS3Params.Body;
    const contentDesignerS3Params = {
        Bucket: params.contentDesignerOutputBucket,
        Key: data.config
    }
    const complete = await waitForExport(oldS3Params, contentDesignerS3Params, 60000);
    if (complete) {
        console.log('Export completed: ', statusfile);
    } else {
        console.log('Export did NOT complete - possibly this is a new install - delete status file so it doesn\'t show up in Exports list in console: ', statusfile);
        await s3.send(new DeleteObjectCommand(s3params));
    }
}

module.exports = class PreUpgradeExport {
    
    async AsyncCreate() {
        return 'This is a new install -- no export required.';
    }

    async AsyncUpdate(ID, params, oldparams) {
        await run_export(params);
    }

    async AsyncDelete() {
        return 'We are deleting the stack -- no export required.';
    }
};
