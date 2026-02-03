/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');
const qnabot = require('qnabot/logging');
const region = process.env.AWS_REGION || 'us-east-1';

async function signS3URL(url, expireSecs) {
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
    if (url.search(/s3:\/\/.+\/.+/) != -1) {
        // bucket s3 format
        bucket = url.split('/')[2];
        key = url.split('/').slice(3).join('/');
    }
    if (bucket && key) {
        qnabot.debug('Convert S3 url to a signed URL: ', url, 'Bucket: ', bucket, ' Key: ', key);
        try {
            const s3 = new S3Client(customSdkConfig('C007', { region }));
            const signedUrl = await getSignedUrl(s3, new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            }), {
                expiresIn: expireSecs,
            });
            return signedUrl;
        } catch (err) {
            qnabot.log('Error signing S3 URL (returning original URL): ', err);
            return url;
        }
    } else {
        qnabot.log('URL is not an S3 url - return unchanged: ', url);
        return url;
    }
}

async function signUrls(urlArr, expireSecs) {
    const signedUrls = urlArr.map((url) => signS3URL(url, expireSecs));
    return Promise.all(signedUrls);
}

async function signUrl(url, expireSecs) {
    const signedUrls = await signUrls([url], expireSecs);
    return signedUrls[0];
}

module.exports = {
    signUrls,
    signUrl,
};
