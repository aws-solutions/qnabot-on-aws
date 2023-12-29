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

const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const customSdkConfig = require('../lib/util/customSdkConfig');
const qnabot = require('qnabot/logging');
const region = process.env.AWS_REGION || 'us-east-1';

function signS3URL(url, expireSecs, callback) {
    let bucket;
    let key;
    if (url.search(/\/s3[.-](\w{2}-\w{4,9}-\d\.)?amazonaws\.com/) != -1) {
        // bucket in path format
        bucket = url.split('/')[3];
        key = url.split('/').slice(4).join('/');
    }
    if (url.search(/\.s3[.-](\w{2}-\w{4,9}-\d\.)?amazonaws\.com/) != -1) {
        // bucket in hostname format
        const hostname = url.split('/')[2];
        bucket = hostname.split('.')[0];
        key = url.split('/').slice(3).join('/');
    }
    if (bucket && key) {
        qnabot.debug('Convert S3 url to a signed URL: ', url, 'Bucket: ', bucket, ' Key: ', key);
        try { // NOSONAR - javascript:S4822 - this is standard javascript IIFE function and no await needed in outer scope but has an async/await in inner scope
            (async () => {
                const s3 = new S3Client(customSdkConfig('C007', { region }));
                url = await getSignedUrl(s3, new GetObjectCommand({
                    Bucket: bucket,
                    Key: key,
                }), {
                    expiresIn: expireSecs,
                });
                callback(url);
            })();
        } catch (err) {
            qnabot.log('Error signing S3 URL (returning original URL): ', err);
            callback(url);
        }
    } else {
        qnabot.debug('URL is not an S3 url - return unchanged: ', url);
        callback(url);
    }
}
exports.signS3URL = signS3URL;
