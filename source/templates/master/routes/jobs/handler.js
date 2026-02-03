/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { S3Client, ListObjectsCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');
const region = process.env.AWS_REGION;
const s3 = new S3Client(customSdkConfig('C022', { region }));

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        const result = await s3.send(new ListObjectsCommand({
            Bucket: event.bucket,
            Prefix: event.prefix,
            MaxKeys: event.perpage || 100,
            Marker: event.token || null,
        }));
        
        console.log('s3 response for routes:', JSON.stringify(result, null, 2));
        if (result.Contents) {
            result.Contents?.sort((a, b) => {
                if (a.LastModified && b.LastModified) {
                    return new Date(b.LastModified).getTime() - new Date(a.LastModified).getTime();
                }
                return 0;
            });
        }
        const mapJobs = result?.Contents?.map((y) => ({
            id: y.Key.split('/').pop(),
            href: `${event.root}/jobs/${event.type}/${encodeURI(y.Key.split('/').pop())}`,
        }));
        
        return {
            token: result.NextMarker,
            jobs: result.Contents ? mapJobs : [],
        };
    } catch (error) {
        throw JSON.stringify({
            type: '[InternalServiceError]',
            data: error,
        });
    }
};
