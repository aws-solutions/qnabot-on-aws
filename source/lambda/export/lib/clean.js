/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { S3Client, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');
const region = process.env.AWS_REGION;
const s3 = new S3Client(customSdkConfig('C011', { region }));

module.exports = async function (config) {
    try {
        if (config.parts.length > 0) {
            await s3.send(new DeleteObjectsCommand({
                Bucket: config.bucket,
                Delete: {
                    Objects: config.parts.map((part) => ({
                        Key: part.key,
                        VersionId: config.version,
                    })),
                    Quiet: true,
                },
            }));
        }
        config.status = 'Completed';
    } catch (error) {
        console.error("An error occured while cleaning S3 objects: ", error)
        throw error;
    }
};
