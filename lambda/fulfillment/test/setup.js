#! /usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var Promise=require('bluebird')
var config=require('../../../config')
var aws=require('aws-sdk')
var outputs=require('../../../bin/exports')
const qnabot = require("qnabot/logging")


module.exports=function(event){
    return Promise.join(
        outputs("dev/master",{wait:true}),
        outputs("dev/lambda",{wait:true})
    ).tap(qnabot.log).spread(function(master,lambda){
        process.env.ES_ADDRESS=master.ElasticsearchEndpoint
        process.env.ES_INDEX=master.ElasticsearchIndex
        process.env.ES_TYPE=master.ElasticsearchType

        process.env.LAMBDA_PREPROCESS=lambda.lambda
        process.env.LAMBDA_POSTPROCESS=lambda.lambda
        process.env.LAMBDA_RESPONSE=lambda.lambda
        process.env.LAMBDA_RESPONSE=lambda.lambda
        process.env.LAMBDA_DEFAULT_QUERY=lambda.lambda
        process.env.LAMBDA_LOG=lambda.lambda

        process.env.AWS_ACCESS_KEY_ID=aws.config.credentials.accessKeyId
        process.env.AWS_SECRET_ACCESS_KEY=aws.config.credentials.secretAccessKey
        process.env.AWS_REGION=config.region
        process.env.ERRORMESSAGE="error"
        process.env.EMPTYMESSAGE="empty"

        process.env.DEFAULT_SETTINGS_PARAM=master.DefaultSettingsSSMParameterName
        process.env.CUSTOM_SETTINGS_PARAM=master.CustomSettingsSSMParameterName
        process.env.DEFAULT_USER_POOL_JWKS_PARAM=master.DefaultUserPoolJwksUrlParameterName

        return Promise.promisify(require('../index.js').handler)(event,{})
    })
}


