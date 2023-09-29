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
const _ = require('lodash');
const JSZip = require('jszip');

JSZip.external.Promise = Promise;
const jszip = new JSZip();

module.exports = class S3Version extends require('./base') {
    constructor() {
        super();
    }

    Create(params, reply) {
        s3.headObject({
            Bucket: params.Bucket,
            Key: params.Key,
        }).promise()
            .tap(console.log)
            .then((result) => reply(null, _.get(result, 'VersionId', '1')))
            .catch(reply);
    }

    Update(ID, params, oldparams, reply) {
        this.Create(params, reply);
    }
};

function getFiles(params) {
    const param = console.log('get param', param);
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
