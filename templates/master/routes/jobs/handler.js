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

aws.config.region = process.env.AWS_REGION;
const s3 = new aws.S3();

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    return s3.listObjects({
        Bucket: event.bucket,
        Prefix: event.prefix,
        MaxKeys: event.perpage || 100,
        Marker: event.token || null,
    }).promise()
        .then((x) => {
            if (x.Contents && Array.isArray(x.Contents)) {
                x.Contents.sort((a, b) => {
                    if (a.LastModified && b.LastModified) {
                        return new Date(b.LastModified).getTime() - new Date(a.LastModified).getTime();
                    }
                    return 0;
                });
            }
            callback(null, {
                token: x.NextMarker,
                jobs: x.Contents.map((y) => ({
                    id: y.Key.split('/').pop(),
                    href: `${event.root}/jobs/${event.type}/${encodeURI(y.Key.split('/').pop())}`,
                })),
            });
        })
        .catch((e) => callback(JSON.stringify({
            type: '[InternalServiceError]',
            data: e,
        })));
};
