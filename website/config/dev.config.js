/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/
var config=require('../../config')

var path=require('path')
var S3Plugin = require('webpack-s3-plugin')
var ProgressBarPlugin = require('progress-bar-webpack-plugin');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var _=require('lodash')
var aws=require('aws-sdk')

module.exports = require('../../bin/exports')('dev/bootstrap').then(function(result){
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
