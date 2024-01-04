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