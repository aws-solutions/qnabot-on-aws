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

const Promise = require('bluebird');
const aws = require('./util/aws');

const s3 = new aws.S3();

async function waitForExport(s3params, timeout) {
    console.log('Checking the status of export');
    const now = Date.now();
    const stoptime = now + timeout;
    let complete = false;
    let timedout = false;
    do {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const res = await s3.getObject(s3params).promise();
        const body = JSON.parse(res.Body.toString());
        console.log(body.status);
        complete = (body.status == 'Completed');
        timedout = (Date.now() > stoptime);
    } while (!complete && !timedout);
    if (!complete && timedout) {
        console.log('Timed out.');
    }
    return complete;
}

async function run_export(params, reply) {
    const ID = 'PreUpgradeExport';
    const data = {
        bucket: params.bucket,
        index: params.index,
        id: params.id,
        config: `status/${params.id}`,
        tmp: `tmp/${params.id}`,
        key: `data/${params.id}`,
        filter: '',
        status: 'Started',
    };
    const s3params = {
        Bucket: data.bucket,
        Key: data.config,
        Body: JSON.stringify(data),
    };
    const statusfile = `${data.bucket}/${data.config}`;
    console.log('Running content export as backup before upgrade.');
    // Create object in export bucket to trigger export lambda
    await s3.putObject(s3params).promise();
    console.log('Wait up to 60 seconds for status to be completed');
    delete s3params.Body;
    const complete = await waitForExport(s3params, 60000);
    if (complete) {
        console.log('Export completed: ', statusfile);
        reply(null, ID);
    } else {
        console.log('Export did NOT complete - possibly this is a new install - delete status file so it doesn\'t show up in Exports list in console: ', statusfile);
        await s3.deleteObject(s3params).promise();
        reply(null, ID);
    }
}

module.exports = class PreUpgradeExport extends require('./base') {
    constructor() {
        super();
    }

    Create(params, reply) {
        run_export(params, reply);
    }

    Update(ID, params, oldparams, reply) {
        run_export(params, reply);
    }
};
