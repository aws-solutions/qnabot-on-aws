#! /usr/bin/env node
/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var Promise=require('bluebird')
var fs=Promise.promisifyAll(require('fs'))
var path=require('path')

var config=require('../config')
var base=require('./master')

delete base.Outputs.AdminBucket
delete base.Outputs.BotName
delete base.Outputs.HandlerArn
delete base.Outputs.HealthArn
delete base.Outputs.FulfilmentArn
delete base.Outputs.ApiURL
delete base.Parameters.BootstrapBucket
delete base.Parameters.BootstrapPrefix

var out=JSON.stringify(base).replace(
    /{"Ref":"BootstrapBucket"}/g,
    '"'+config.publicBucket+'"')

out=out.replace(
    /{"Ref":"BootstrapPrefix"}/g,
    '"'+config.publicPrefix+'"')

module.exports=JSON.parse(out)

