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

const aws = require('aws-sdk');

aws.config.region = process.env.AWS_REGION || 'us-east-1';
aws.config.signatureVersion = 'v4';
const region = process.env.AWS_REGION || 'us-east-1';
const { S3Client, ListObjectVersionsCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('./util/customSdkConfig');

const s3 = new S3Client(customSdkConfig({ region }));

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
    return s3.send(new ListObjectVersionsCommand({
        Bucket: params.Bucket,
        Prefix: params.Prefix,
    }))
        .then((x) => [...(x.Versions || []), ...(x.DeleteMarkers || [])])
        .then(files => {
            console.log("Files: ", files);
            return files.map((file) => ({
                Key: file.Key,
                VersionId: file.VersionId,
            }));
        
        })
        .then((keys) => { // NOSONAR - javascript:S3800 - this is existing pattern where thenable response returns true
            console.log("Keys: ", keys);
            if (keys?.length > 0) {
                return s3.send(new DeleteObjectsCommand({
                    Bucket: params.Bucket,
                    Delete: {
                        Objects: keys,
                    },
                }))
                    .then((response) => {
                        console.log("Delete Response Status Code: ", response?.$metadata?.httpStatusCode);
                        return true;  
                    });
            }
            return false;
        });
}