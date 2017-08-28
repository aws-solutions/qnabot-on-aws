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
var run=require('../../../bin/run.js')

var fs=Promise.promisifyAll(require('fs'))
var aws=require('aws-sdk')
aws.config.setPromisesDependency(Promise)
aws.config.region='us-east-1'
var cf=new aws.CloudFormation()
var exports={}

module.exports=function(event){
    return cf.listExports().promise()
    .get('Exports')
    .each(exp=>exports[exp.Name]=exp.Value)
    .then(function(){
        process.env.LEX_SLOTTYPE=exports["QNA-DEV-HANDLER-SLOTTYPE"]
        process.env.LEX_INTENT=exports["QNA-DEV-HANDLER-INTENT"]
        process.env.LEX_BOT=exports["QNA-DEV-HANDLER-BOT"]
        process.env.ES_ADDRESS=exports["QNA-DEV-ED-ADDRESS"]
        process.env.ES_INDEX=exports["QNA-DEV-HANDLER-INDEX"]
        process.env.ES_TYPE=exports["QNA-DEV-HANDLER-TYPE"]
        process.env.AWS_ACCESS_KEY_ID=aws.config.credentials.accessKeyId
        process.env.AWS_SECRET_ACCESS_KEY=aws.config.credentials.secretAccessKey
        process.env.REGION='us-east-1'
        process.env.ERRORMESSAGE="error"
        process.env.EMPTYMESSAGE="empty"
        process.env.IMAGE_BUCKET=exports["QNA-DEV-BUCKET"]
        process.env.POOLID=exports["QNA-DEV-HANDLER-IDPOOL"]
        process.env.CLIENTID=exports["QNA-DEV-HANDLER-CLIENT"]
        process.env.USERPOOL=exports["QNA-DEV-HANDLER-USERPOOL"]
    })
    .then(()=>run(require('../index.js').handler,event))
    .return(true)
}


