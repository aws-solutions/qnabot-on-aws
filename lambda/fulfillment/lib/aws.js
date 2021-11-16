// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var Promise=require('bluebird')
var aws=require('aws-sdk')

aws.config.setPromisesDependency(Promise)
aws.config.region=process.env.AWS_REGION || 'us-east-1'
aws.config.signatureVersion='v4'

module.exports=aws
