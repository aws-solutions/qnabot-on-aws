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

var base=require('../templates/admin-base.json')
var config=require('../config')

fs.readFileAsync(path.join(__dirname,'../lambda/cfn-variable/index.js'),'utf-8')
.then(function(code){
    base.Resources.Variable.Properties.Code.ZipFile=code
    base.Mappings.PublicBucket.Bucket.Name=config.publicBucket
    
    return JSON.stringify(base,null,1)
})
.then(template=>fs.writeFileAsync(path.join(__dirname,'../templates/admin.json'),template))
