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


var base_path=path.join('../templates/api/')
var base=require(path.join(base_path,'api.json'))

base.Resources=Object.assign(
    require(path.join(base_path,'config.json')),
    require(path.join(base_path,'root.json')),
    require(path.join(base_path,'qa.json')),
    require(path.join(base_path,'search.json')),
    require(path.join(base_path,'info.json')),
    require(path.join(base_path,'lambda.json')),
    require(path.join(base_path,'client.json')),
    require(path.join(base_path,'health.json')),
    require(path.join(base_path,'policies.json')),
    require(path.join(base_path,'bot.json'))
)
fs.writeFileAsync(__dirname+'/../templates/api.json',JSON.stringify(base,null,2))
.tap(console.log)

