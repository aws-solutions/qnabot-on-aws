/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

const fs = require('fs');
const response = require('cfn-response');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');
const region = process.env.AWS_REGION;
const s3 = new S3Client(customSdkConfig('C018', { region }));

exports.handler = function (event, context, cb) {
    console.log(JSON.stringify(event, null, 2));

    try {
        if (event.RequestType !== 'Delete') {
            const files = fs.readdirSync(`${__dirname}/examples`);
            Promise.all(files.map((x) => {
                const name = x;
                const text = fs.readFileSync(`${__dirname}/examples/${x}`, 'utf-8');
                const params = {
                    Bucket: event.ResourceProperties.Bucket,
                    Key: `examples/documents/${name}`,
                    Body: text,
                };
                const putObjectCmd = new PutObjectCommand(params);
                return s3.send(putObjectCmd);
            }))
                .then((result) => {
                    console.log(result);
                    if (event.ResponseURL) {
                        response.send(event, context, response.SUCCESS);
                    } else {
                        cb(null);
                    }
                })
                .catch((e) => {
                    console.log(e);
                    response.send(event, context, response.FAILED);
                });
        } else {
            response.send(event, context, response.SUCCESS);
        }
    } catch (e) {
        console.log(e);
        response.send(event, context, response.FAILED);
    }
};
