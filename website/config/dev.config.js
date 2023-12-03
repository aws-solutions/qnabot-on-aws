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
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const _ = require('lodash');
const aws = require('aws-sdk');

module.exports = require('../../bin/exports')('dev/master').then(function(result){
    return {
    watch: true,
    watchOptions:{
        aggregateTimeout:500
    },
    plugins:_.compact([
        new BundleAnalyzerPlugin(),
        new S3Plugin({
            s3Options: {
                accessKeyId:aws.config.credentials.accesskeyId,
                secretAccessKey:aws.config.credentials.secretAccessKey,
                region:config.region
            },
            s3UploadOptions:{
                Bucket:result.Bucket
            }
        }),
        new ProgressBarPlugin(),
    ]),
    resolve:{
        alias:{
            vue$:'vue/dist/vue.js',
        }
    },
    module: {
        rules: [
          {
            test: /\.vue$/,
            loader: 'vue-loader',
            options: {
              loaders: {
                'scss': 'vue-style-loader!css-loader!sass-loader',
                'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax'
              }
            }
          }
        ]
    }
    }
})
