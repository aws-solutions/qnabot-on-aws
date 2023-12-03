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

module.exports = async function (config) {
    try {
        if (config.parts.length > 0) {
            await s3.deleteObjects({
                Bucket: config.bucket,
                Delete: {
                    Objects: config.parts.map((part) => ({
                        Key: part.key,
                        VersionId: config.version,
                    })),
                    Quiet: true,
                },
            }).promise();
        }
        config.status = 'Completed';
    } catch (error) {
        console.error("An error occured while cleaning S3 objects: ", error);
        throw error;
    }
};
