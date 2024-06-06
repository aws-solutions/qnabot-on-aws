/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

const { S3Client, ListObjectsCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');
const region = process.env.AWS_REGION;
const s3 = new S3Client(customSdkConfig('C022', { region }));

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    return s3.send(new ListObjectsCommand({
        Bucket: event.bucket,
        Prefix: event.prefix,
        MaxKeys: event.perpage || 100,
        Marker: event.token || null,
    }))
        .then((x) => {
            console.log('s3 response for routes:', JSON.stringify(x, null, 2));
            if (x.Contents) {
                x.Contents?.sort((a, b) => {
                    if (a.LastModified && b.LastModified) {
                        return new Date(b.LastModified).getTime() - new Date(a.LastModified).getTime();
                    }
                    return 0;
                });
            }
            const mapJobs = x?.Contents?.map((y) => ({
                id: y.Key.split('/').pop(),
                href: `${event.root}/jobs/${event.type}/${encodeURI(y.Key.split('/').pop())}`,
            }));
            callback(null, {
                token: x.NextMarker,
                jobs: x.Contents ? mapJobs : [],
            })
        })
        .catch((e) => callback(JSON.stringify({
            type: '[InternalServiceError]',
            data: e,
        })));
};
