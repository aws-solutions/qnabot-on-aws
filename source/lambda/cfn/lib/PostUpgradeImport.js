/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('./util/customSdkConfig');

const region = process.env.AWS_REGION || 'us-east-1';
const s3 = new S3Client(customSdkConfig({ region }));

async function copyData(oldS3ExportParams, s3exportparms, s3importparms) {
    console.log('Reading previously exported data');
    try {
        const res = await s3.send(new GetObjectCommand (s3exportparms));
        const data_json = await res.Body.transformToString();
        const count = data_json.length;
        if (count > 0) {
            console.log(`Copy data to import bucket: length: ${count}`);
            s3importparms.Body = data_json;
            await s3.send(new PutObjectCommand(s3importparms));
        } else {
            console.log('Export file has no data - skipping import');
        }
        return count;
    } 
    catch (err) {
        // Necessary for backwards compatibility.
        if (err.name === 'AccessDenied') {
            const res = await s3.send(new GetObjectCommand (oldS3ExportParams));
            const data_json = await res.Body.transformToString();
            const count = data_json.length;
            if (count > 0) {
                console.log(`Copy data to import bucket: length: ${count}`);
                s3importparms.Body = data_json;
                await s3.send(new PutObjectCommand(s3importparms));
            } else {
                console.log('Export file has no data - skipping import');
            }
            return count;
        }
        console.log('No previously exported data:', err);
        return 0;
    }
}

async function waitForImport(s3params, timeout) {
    console.log('Checking the status of import job');
    const now = Date.now();
    const stoptime = now + timeout;
    let complete = false;
    let timedout = false;
    do {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        try {
            const res = await s3.send(new GetObjectCommand(s3params));
            const readableStream = Buffer.concat(await res.Body.toArray())
            const body = JSON.parse(readableStream);
            console.log(body.status);
            complete = (body.status == 'Complete');
        } catch (e) {
            console.log(`Exception during s3.getObject: ${e}`);
        }
        timedout = (Date.now() > stoptime);
    } while (!complete && !timedout);
    if (!complete && timedout) {
        console.log('Timed out.');
    }
    return complete;
}

async function run_import(params) {
    const data = {
        bucket: params.importbucket,
        index: params.index,
        id: params.id,
        config: `status/${params.id}`,
        tmp: `tmp/${params.id}`,
        key: `data/${params.id}`,
        filter: '',
        status: 'Started',
    };
    const oldS3ExportParams = {
        Bucket: params.exportbucket,
        Key: `data-export/${params.id}`,
    };
    const s3exportparms = {
        Bucket: params.contentDesignerOutputBucket,
        Key: `data-export/${params.id}`,
    };
    const s3importparms = {
        Bucket: params.importbucket,
        Key: data.key,
    };
    const exportfile = `${params.contentDesignerOutputBucket}/data-export/${params.id}`;
    const importfile = `${params.importbucket}/${data.key}`;

    console.log(`copy export file ${exportfile} to import bucket ${importfile}`);
    const count = await copyData(oldS3ExportParams, s3exportparms, s3importparms);
    if (count > 0) {
        console.log('Running import process.');
        const s3params = {
            Bucket: params.contentDesignerOutputBucket,
            Key: `status-import/${params.id}`,
        };
        console.log('Wait up to 60 seconds for status to be completed');
        const complete = await waitForImport(s3params, 60000);
        if (complete) {
            console.log('Import completed: ', exportfile);
        } else {
            console.log('Import did NOT complete: ', exportfile);
        }
    } else {
        console.log('No records to import in: ', exportfile);
    }
}

module.exports = class PostUpgradeImport{

    async AsyncCreate() {
        return 'This is a new install -- no import required.';
    }

    async AsyncUpdate(ID, params, oldparams) {
        await run_import(params);
    }

    async AsyncDelete() {
        return 'We are deleting the stack -- no import required.';
    }
};