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

const aws = require('aws-sdk');

aws.config.region = process.env.AWS_REGION;
const lambda = new aws.Lambda();
const lex = new aws.LexModelBuildingService();
const s3 = new aws.S3();
const crypto = require('crypto');

exports.handler = function (event, context, callback) {
    return s3.getObject({
        Bucket: process.env.STATUS_BUCKET,
        Key: process.env.STATUS_KEY,
    }).promise()
        .then((x) => JSON.parse(x.Body.toString()))
        .then((status) => lex.getBot({
            name: process.env.BOT_NAME,
            versionOrAlias: '$LATEST',
        }).promise()
            .then((result) => {
                status.status = result.status;
                if (result.status === 'BUILDING') {
                    return new Promise((res, rej) => {
                        setTimeout(() => {
                            lambda.invoke({
                                FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
                                InvocationType: 'Event',
                                Payload: JSON.stringify(event),
                            }).promise()
                                .then(res).catch(rej);
                        }, 2 * 1000);
                    });
                }
                return s3.putObject({
                    Bucket: process.env.STATUS_BUCKET,
                    Key: process.env.STATUS_KEY,
                    Body: JSON.stringify(status),
                }).promise();
            }))
        .then(() => callback(null))
        .catch(callback);
};
