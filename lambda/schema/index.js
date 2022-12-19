// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    var schema = {
        quiz: require('./quiz.js'),
        qna: require('./qna.js'),
        slottype: require('./slottype.js')
    }
    callback(null,schema);
}

