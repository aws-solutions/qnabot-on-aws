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

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('./util/customSdkConfig');

const region = process.env.AWS_REGION || 'us-east-1';
const s3 = new S3Client(customSdkConfig({ region }));
const mime = require('mime-types');
const JSZip = require('jszip');
JSZip.external.Promise = global.Promise;
const jszip = new JSZip();

module.exports = class S3Unzip extends require('./base') {
    constructor() {
        super();
    }
    async Create(params, reply) {
        console.log('params', params);
        try {
            const files = await getFiles(params);
            const results = await Promise.all(files.map(async (file) => {
                const type = mime.lookup(file);
                console.log(`${file}:${type}`);
                const content = await jszip.file(file).async('nodebuffer');
                const param = {
                    Bucket: params.DstBucket,
                    Key: file,
                    Body: content,
                    ContentType: type || null
                };
                console.log(param);
                await s3.send(new PutObjectCommand(param));
                console.log(file);
            }))
            console.log(results);
            reply(null, `${params.SrcBucket}/${params.Key}`);
        } catch (err) {
            reply(err, `${params.SrcBucket}/${params.Key}`);
        }
    }

    async Update(ID, params, oldparams, reply) {
        await this.Create(params, reply);
    }

    Delete(ID, params, reply) {
        reply(null, ID, null);
    }
};

async function getFiles(params) {
    const param = {
        Bucket: params.SrcBucket,
        Key: params.Key
    };
    console.log('get param', param);
    try {
        const s3Object = await s3.send(new GetObjectCommand(param));
        const jszipContent = await jszip.loadAsync(await s3Object.Body.transformToByteArray()); // NOSONAR - add DDOS prevention code 
        const files = jszipContent.files;
        const fileNames = Object.keys(files).map(key => files[key]).filter(file => !file.dir).map(file => file.name);
        console.log(fileNames);
        return fileNames;
    } catch (e) {
        console.error('An error occured in getFiles: ', e);
    }
}
