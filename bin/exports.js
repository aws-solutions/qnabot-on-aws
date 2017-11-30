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


process.env.AWS_PROFILE=require('../config').profile
process.env.AWS_DEFAULT_REGION=require('../config').profile
var aws=require('aws-sdk')
var Promise=require('bluebird')
aws.config.setPromisesDependency(Promise)
var config=require('../config')
module.exports=function(region=config.region){
    aws.config.region=region
    var cf=new aws.CloudFormation()

    var exports={}
    
    return cf.listExports().promise()
    .get('Exports')
    .each(exp=>exports[exp.Name]=exp.Value)
    .return(exports)
}

if(!module.parent){
    module.exports()
    .then(exports=>console.log(JSON.stringify(exports,null,4)))
}
