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

const base = require('./base');
const Promise = require('bluebird');
const aws = require('../../lib/util/aws');
const s3 = new aws.S3();
const range = require('range').range;
const outputs = require('../../../../bin/exports');

const setup = outputs('dev/bucket')
    .tap(function (output) {
        return Promise.all(
            range(2000).map((x) => {
                return s3
                    .putObject({
                        Bucket: output.Bucket,
                        Key: 'DeleteMe-' + x,
                        Body: 'Please no!!!-' + x
                    })
                    .promise();
            })
        ).delay(2000);
    })
    .then(function (output) {
        return {
            Bucket: output.Bucket
        };
    });

exports.create = () => params('Create');
exports.update = () => params('Update');
exports.delete = () => params('Delete');

function params(stage) {
    return setup.then((param) => base('S3Clear', stage, param));
}
