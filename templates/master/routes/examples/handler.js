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
const s3 = new S3Client(customSdkConfig('C018', { region }));

exports.photos = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    return s3.send(new ListObjectsCommand({
        Bucket: event.bucket,
        Prefix: event.prefix,
        MaxKeys: event.perpage || 100,
        Marker: event.token || null,
    }))
        .then((x) => {
            console.log('s3 response for photos:', JSON.stringify(x, null, 2));
            const photos = x?.Contents?.map((value) => {
                const key = value.Key.split('/').pop();
                return `${event.root}/examples/photos/${key}`;
            }, []);
            callback(null, {
                token: x.NextMarker,
                photos,
            });
        })
        .catch((e) => callback(JSON.stringify({
            type: '[InternalServiceError]',
            data: e,
        })));
};

exports.documents = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    return s3.send(new ListObjectsCommand({
        Bucket: event.bucket,
        Prefix: event.prefix,
        MaxKeys: event.perpage || 100,
        Marker: event.token || null,
    }))
        .then((x) => {
            console.log('s3 response for documents:', JSON.stringify(x, null, 2));
            const examples = x?.Contents?.reduce((accum, value) => {
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
            }, []);

            callback(null, {
                token: x.NextMarker,
                examples: examples ? Object.keys(examples).map((x) => examples[x]) : [],
            });
        })
        .catch((e) => callback(JSON.stringify({
            type: '[InternalServiceError]',
            data: e,
        })));
};
