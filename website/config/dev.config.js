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
const config = require('../../config.json');
const path = require('path');
const S3Plugin = require('webpack-s3-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const _ = require('lodash');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const { fromEnv } = require('@aws-sdk/credential-providers');
const { credentials } = fromEnv();
let assetBucketName;
if (process.env.ASSET_BUCKET_NAME === '') {
    throw new Error('ASSET_BUCKET_NAME must be set. See README.md for instruction');
} else {
    assetBucketName = process.env.ASSET_BUCKET_NAME;
}


module.exports = {
    mode: 'development',
    watch: true,
    watchOptions:{
        aggregateTimeout:500
    },
    plugins:_.compact([
        new BundleAnalyzerPlugin(),
        new S3Plugin({
            s3Options: {
                credentials,
                region:config.region
            },
            s3UploadOptions:{
                Bucket: assetBucketName,
                ACL: 'private'
            }
        }),
        new ProgressBarPlugin(),
    ]),
}
