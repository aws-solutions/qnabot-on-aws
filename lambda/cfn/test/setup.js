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

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const Promise = require('bluebird');
const config = require('../../../config.json');

const outputs = require('../../../bin/exports');
const fs = Promise.promisifyAll(require('fs'));
const aws = require('aws-sdk');
aws.config.setPromisesDependency(Promise);
aws.config.region = config.region;

module.exports = function (event) {
    process.env.AWS_ACCESS_KEY_ID = aws.config.credentials.accessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = aws.config.credentials.secretAccessKey;
    process.env.AWS_REGION = config.region;

    return Promise.join(event, outputs('dev/lambda')).spread(function (ev, output) {
        return new Promise(function (res, rej) {
            require('../index.js').handler(ev, {
                invokedFunctionArn: output.lambda,
                done: res
            });
        });
    });
};
