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

const { S3Client, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');

const region = process.env.AWS_REGION;
const s3 = new S3Client(customSdkConfig('C012', { region }));
const _ = require('lodash');

module.exports = async function (config) {
    if (config.parts.length > 0) {
        try {
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
        } catch (error) {
            console.error('An error occurred while clean task : ', error);
            throw error;
        }
    }
    config.status = 'Completed';
};
