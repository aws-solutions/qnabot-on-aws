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

const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('./util/customSdkConfig');

const region = process.env.AWS_REGION || 'us-east-1';
const s3 = new S3Client(customSdkConfig({ region }));

async function copyData(s3exportparms, s3importparms) {
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
    } catch (err) {
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
        await new Promise((resolve) => setTimeout(resolve, 1000));
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

async function run_import(params, reply) {
    const ID = 'PostUpgradeImport';
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
    const s3exportparms = {
        Bucket: params.exportbucket,
        Key: data.key,
    };
    const s3importparms = {
        Bucket: params.importbucket,
        Key: data.key,
    };
    const exportfile = `${params.exportbucket}/${data.key}`;
    const importfile = `${params.importbucket}/${data.key}`;

    console.log(`copy export file ${exportfile} to import bucket ${importfile}`);
    const count = await copyData(s3exportparms, s3importparms);
    if (count > 0) {
        console.log('Running import process.');
        const s3params = {
            Bucket: params.importbucket,
            Key: data.config,
        };
        console.log('Wait up to 60 seconds for status to be completed');
        delete s3params.Body;
        const complete = await waitForImport(s3params, 60000);
        if (complete) {
            console.log('Import completed: ', exportfile);
            reply(null, ID);
        } else {
            console.log('Import did NOT complete: ', exportfile);
            reply(null, ID);
        }
    } else {
        console.log('No records to import in: ', exportfile);
        reply(null, ID);
    }
}

module.exports = class PostUpgradeImport extends require('./base') {
    constructor() {
        super();
    }

    async Create(params, reply) {
        await run_import(params, reply);
    }

    async Update(ID, params, oldparams, reply) {
        await run_import(params, reply);
    }
};
