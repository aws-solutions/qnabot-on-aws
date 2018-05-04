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
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.profile
var Promise=require('bluebird')
var merge=require('webpack-merge').smart
var path=require('path')
var webpack=require('webpack')
var _=require('lodash')

module.exports = Promise.join(
    require('./base.config'),
    process.env.NODE_ENV==='dev' ? require('./dev.config') : {},
    process.env.NODE_ENV==='prod' ? require('./prod.config') : {}
).then(merge)
