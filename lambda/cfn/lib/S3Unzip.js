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

const Promise = require('./util/promise');
const aws = require('./util/aws');

const s3 = new aws.S3();
const mime = require('mime-types');

const JSZip = require('jszip');

JSZip.external.Promise = Promise;
const jszip = new JSZip();

module.exports = class S3Unzip extends require('./base') {
    constructor() {
        super();
    }

    Create(params, reply) {
        console.log('params', params);

        getFiles(params)
            .map((file) => {
                const type = mime.lookup(file);
                console.log(`${file}:${type}`);

                return jszip.file(file).async('nodebuffer')
                    .then((content) => {
                        const param = {
                            Bucket: params.DstBucket,
                            Key: file,
                            Body: content,
                            ContentType: type || null,
                        };
                        console.log(param);
                        return s3.putObject(param).promise();
                    });
            })
            .map(console.log)
            .then(() => reply(null, `${params.SrcBucket}/${params.Key}`))
            .catch((err) => reply(err, `${params.SrcBucket}/${params.Key}`));
    }

    Update(ID, params, oldparams, reply) {
        this.Create(params, reply);
    }

    Delete(ID, params, reply) {
        reply(null, ID, null);
    }
};

function getFiles(params) {
    const param = {
        Bucket: params.SrcBucket,
        Key: params.Key,
    };
    console.log('get param', param);
    return s3.getObject(param).promise()
        .get('Body')
        .then((buff) => jszip.loadAsync(buff)
            .get('files')
            .then((files) => Object.keys(files)
                .map((key) => files[key])
                .filter((file) => !file.dir)
                .map((file) => file.name))
            .tap(console.log));
}
