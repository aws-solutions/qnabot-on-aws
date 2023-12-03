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

module.exports = class S3Clear extends require('./base') {
    constructor() {
        super();
        this.LongRunning = {
            PingInSeconds: 1,
            MaxPings: 1000,
            LambdaApi: new aws.Lambda(),
            Methods: {
                Delete(createReponse, ID, params, reply, notDone) {
                    del(params)
                        .then((status) => (status ? notDone() : reply(null, ID)))
                        .catch(reply);
                },
            },
        };
    }

    Delete(ID, params, reply) {
        del(params)
            .then(() => reply(null, ID))
            .catch(reply);
    }
};

function del(params) {
    return s3.listObjectVersions({
        Bucket: params.Bucket,
        Prefix: params.Prefix,
    }).promise().tap(console.log)
        .then((x) => x.Versions.concat(x.DeleteMarkers))
        .tap((x) => console.log('Files', x))
        .then((files) => files.map((file) => ({
            Key: file.Key,
            VersionId: file.VersionId,
        })))
        .tap((x) => console.log('going to delete', x))
        .then((keys) => {
            if (keys.length > 0) {
                return s3.deleteObjects({
                    Bucket: params.Bucket,
                    Delete: {
                        Objects: keys,
                    },
                }).promise()
                    .return(true);
            }
            return false;
        });
}
