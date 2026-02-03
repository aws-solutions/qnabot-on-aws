/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { S3Client, ListObjectsCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');
const region = process.env.AWS_REGION;
const s3 = new S3Client(customSdkConfig('C018', { region }));

exports.photos = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        const result = await s3.send(new ListObjectsCommand({
            Bucket: event.bucket,
            Prefix: event.prefix,
            MaxKeys: event.perpage || 100,
            Marker: event.token || null,
        }));
        
        console.log('s3 response for photos:', JSON.stringify(result, null, 2));
        const photos = result?.Contents?.map((value) => {
            const key = value.Key.split('/').pop();
            return `${event.root}/examples/photos/${key}`;
        }, []);
        
        return {
            token: result.NextMarker,
            photos,
        };
    } catch (error) {
        throw JSON.stringify({
            type: '[InternalServiceError]',
            data: error,
        });
    }
};

exports.documents = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        const result = await s3.send(new ListObjectsCommand({
            Bucket: event.bucket,
            Prefix: event.prefix,
            MaxKeys: event.perpage || 100,
            Marker: event.token || null,
        }));
        
        console.log('s3 response for documents:', JSON.stringify(result, null, 2));
        const examples = result?.Contents?.reduce((accum, value) => {
            let key = value.Key.split('/').pop().split('.');
            const ext = key.length > 1 ? key.pop() : 'txt';
            key = key[0];
            const href = `${event.root}/examples/documents/${key}.${ext}`;
            if (!accum[key]) {
                accum[key] = { id: key };
            }
            if (ext === 'json') {
                accum[key].document = { href };
            } else {
                accum[key].description = { href };
            }
            return accum;
        }, {});

        return {
            token: result.NextMarker,
            examples: examples ? Object.keys(examples).map((x) => examples[x]) : [],
        };
    } catch (error) {
        throw JSON.stringify({
            type: '[InternalServiceError]',
            data: error,
        });
    }
};
