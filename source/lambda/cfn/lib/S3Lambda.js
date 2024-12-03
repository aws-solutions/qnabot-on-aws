/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { S3Client, PutBucketNotificationConfigurationCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('./util/customSdkConfig');

const region = process.env.AWS_REGION || 'us-east-1';
const nativePromise = require('./util/promise');
const base = require('./base.js');

const s3 = new S3Client(customSdkConfig({ region }));

module.exports = class S3Lambda extends base {
    constructor() {
        super('BucketNotificationConfiguration');
    }

    Create(params, reply) {
        nativePromise.retry(
            () => s3.send(new PutBucketNotificationConfigurationCommand(params)),
        )
            .then(() => reply(null))
            .catch(reply);
    }

    /**
     Delete has in the past removed the putBucketNotificationConfiguration by setting
     the configuration to an empty array. Change to support upgrading a stack to the new
     use of nested stacks for import and export. The deletion of the original resources
     occurred after the new configuration had been set. This caused import and export
     to fail as the creation event of job files in the S3 bucket went unnoticed. This fix
     has no impact on bucket cleanup / removal.
     */
    Delete(ID, params, reply) {
        reply(null);
    }

    Update(ID, params, oldparams, reply) {
        this.Create(params, reply);
    }
};
