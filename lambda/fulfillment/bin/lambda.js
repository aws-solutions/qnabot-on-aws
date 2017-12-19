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

var argv=require('optimist').argv
var chalk=require('chalk')
var Promise=require('bluebird')
var config=require('../../../config')
var aws=require('aws-sdk')
aws.config.setPromisesDependency(Promise)
aws.config.region=config.region
var env=require('../../../bin/exports')

module.exports=function(event){
    return env().then(function(envs){
        process.env.ES_ADDRESS=envs["QNA-DEV-ES-ADDRESS"]
        process.env.ES_INDEX=envs["QNA-DEV-INDEX"]
        process.env.ES_TYPE=envs["QNA-DEV-TYPE"]
        process.env.LAMBDA_PREPROCESS=envs["QNA-DEV-LAMBDA"]
        process.env.LAMBDA_POSTPROCESS=envs["QNA-DEV-LAMBDA"]
        process.env.LAMBDA_RESPONSE=envs["QNA-DEV-LAMBDA"]
        process.env.LAMBDA_LOG=envs["QNA-DEV-LAMBDA"]
        process.env.AWS_ACCESS_KEY_ID=aws.config.credentials.accessKeyId
        process.env.AWS_SECRET_ACCESS_KEY=aws.config.credentials.secretAccessKey
        process.env.AWS_REGION=config.region
        process.env.ERRORMESSAGE="error"
        process.env.EMPTYMESSAGE="empty"
    })
    .then(()=>Promise.promisify(require('../index.js').handler)(event,{}))
}


