/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { S3Client, HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('./util/customSdkConfig');

const region = process.env.AWS_REGION || 'us-east-1';
const s3 = new S3Client(customSdkConfig({ region }));
const _ = require('lodash');
const JSZip = require('jszip');
JSZip.external.Promise = global.Promise;
const jszip = new JSZip();

module.exports = class S3Version extends require('./base') {
    constructor() {
        super();
    }
    async Create(params, reply){
        try {
            const result = await s3.send(new HeadObjectCommand({
                Bucket: params.Bucket,
                Key: params.Key
            }));
            console.log(result);
            reply(null, _.get(result, 'VersionId', '1'));
        } catch (e) {
            console.error('An error occured while executing S3 HeadObject command: ', e);
            reply(e);
        }
    }

    async Update(ID, params, oldparams, reply) {
        await this.Create(params, reply);
    }
}