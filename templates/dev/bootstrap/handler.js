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

const { S3Client, DeleteObjectsCommand, ListObjectVersionsCommand } = require('@aws-sdk/client-s3');
const region = process.env.AWS_REGION;
const s3Client = new S3Client({ region })

exports.handler = function (event, context) {
    console.log(JSON.stringify(event, null, 2));

    if (event.RequestType === 'Delete') {
        Delete(event.ResourceProperties)
            .then(() => send(event, context, SUCCESS))
            .catch((x) => {
                console.log(x);
                send(event, context, FAILED);
            });
    } else {
        send(event, context, SUCCESS);
    }
};

function Delete(params) {
    return new Promise((res, rej) => {
        function next() {
            client.send(new ListObjectVersionsCommand(({
                Bucket: params.Bucket,
            }))).then((x) => {
                console.log("list of objectversions is", x);
                if (x.Versions)
                    return x.Versions.map((file) => ({
                        Key: file.Key,
                        VersionId: file.VersionId,
                    }));
            })
                .then((keys) => {
                    console.log('going to delete', keys);
                    if (keys && keys.length > 0) {
                        return s3Client.send(new DeleteObjectsCommand(({
                            Bucket: params.Bucket,
                            Delete: {
                                Objects: keys,
                            },
                        }))).then(() => next())
                            .catch(rej);
                    }
                    res();
                });
        }
        next();
    });
}
