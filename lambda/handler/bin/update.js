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

var fs=Promise.promisifyAll(require('fs'))
var config=require('../../template/config')
config.base_dir='../../template'
console.log(config)

var Lambda=require('lambda')
var cf=new (require('cloudformation'))(config)
var aws=require('aws')
var aws_lambda=new aws.Lambda({region:config.region})

var lambda_config=require('../config')
lambda_config.base_dir='..'
var lambda=new Lambda(lambda_config)

Promise.join(
    cf.getOutput(),
    (require('cloudformation')).getExport('AssetBucket',config.region),
    (require('cloudformation')).getExport('LambdaLibrary',config.region)
    ,lambda.upload()
)
.spread(function(output,bucket,library){
    var base=require('../../config')
    console.log(library+'/'+base.ProjectName+'-handler.zip')
    var params_base = {
        Publish: true, 
        S3Bucket:bucket,
        S3Key:library+'/'+base.ProjectName+'-handler.zip'
    };
   
    var handler_param=Object.assign({
            FunctionName:output.HandlerArn
        },
        params_base
    )
    var fulfilment_param=Object.assign({
            FunctionName:output.FulfilmentArn
        },
        params_base
    )

    return Promise.join(
        aws_lambda.updateFunctionCode(handler_param).promise(),
        aws_lambda.updateFunctionCode(fulfilment_param).promise()
    )
})

