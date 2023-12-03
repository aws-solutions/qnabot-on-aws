#! /usr/bin/env node
/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

const config = require('../../../config.json');
const aws = require('aws-sdk');
const outputs = require('../../../bin/exports');
const qnabot = require('qnabot/logging');

module.exports = async function (event) {
    const [master, lambda] = await Promise.all([
        outputs('dev/master', { wait: true }),
        outputs('dev/lambda', { wait: true })
    ])
    qnabot.log([master,lambda]);
    process.env.ES_ADDRESS = master.ElasticsearchEndpoint;
    process.env.ES_INDEX = master.ElasticsearchIndex;
    process.env.ES_TYPE = master.ElasticsearchType;

    process.env.LAMBDA_PREPROCESS=lambda.lambda;
    process.env.LAMBDA_POSTPROCESS=lambda.lambda;
    process.env.LAMBDA_RESPONSE=lambda.lambda;
    process.env.LAMBDA_RESPONSE=lambda.lambda;
    process.env.LAMBDA_DEFAULT_QUERY=lambda.lambda;
    process.env.LAMBDA_LOG=lambda.lambda;

    process.env.AWS_ACCESS_KEY_ID=aws.config.credentials.accessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY=aws.config.credentials.secretAccessKey;
    process.env.AWS_REGION=config.region;
    process.env.ERRORMESSAGE="error";
    process.env.EMPTYMESSAGE="empty";

    process.env.DEFAULT_SETTINGS_PARAM=master.DefaultSettingsSSMParameterName;
    process.env.CUSTOM_SETTINGS_PARAM=master.CustomSettingsSSMParameterName;
    process.env.DEFAULT_USER_POOL_JWKS_PARAM=master.DefaultUserPoolJwksUrlParameterName;

    const handler = require('../index.js').handler;
    return handler(event,{});
}


