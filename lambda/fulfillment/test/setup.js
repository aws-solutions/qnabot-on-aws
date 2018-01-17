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
var config=require('../../../config')
var aws=require('aws-sdk')
var outputs=require('../../../bin/exports')

module.exports=function(event){
    return Promise.join(
        outputs("dev/master",{wait:true}),
        outputs("dev/lambda",{wait:true})
    ).tap(console.log).spread(function(master,lambda){
        process.env.ES_ADDRESS=master.ElasticSearchEndpoint
        process.env.ES_INDEX=master.ElasticSearchIndex
        process.env.ES_TYPE=master.ElasticSearchType

        process.env.LAMBDA_PREPROCESS=lambda.lambda
        process.env.LAMBDA_POSTPROCESS=lambda.lambda
        process.env.LAMBDA_RESPONSE=lambda.lambda
        process.env.LAMBDA_LOG=lambda.lambda

        process.env.AWS_ACCESS_KEY_ID=aws.config.credentials.accessKeyId
        process.env.AWS_SECRET_ACCESS_KEY=aws.config.credentials.secretAccessKey
        process.env.AWS_REGION=config.region
        process.env.ERRORMESSAGE="error"
        process.env.EMPTYMESSAGE="empty"

        return Promise.promisify(require('../index.js').handler)(event,{})
    })
}


