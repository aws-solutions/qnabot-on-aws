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

var base=require('../templates/dashboard-base.json')

fs.readFileAsync(path.join(__dirname,'../templates/dashboard-body.json'),'utf8')
.then(function(body){
    base.Resources.dashboard.Properties.DashboardBody={
        "Fn::Sub":body.replace(/(\r\n|\n|\r)/gm,"")
    }

    return JSON.stringify(base)
})
.then(function(file){
    fs.writeFileAsync(path.join(__dirname,'../templates/dashboard.json'),file)
})
