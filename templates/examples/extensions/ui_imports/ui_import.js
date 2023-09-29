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

const fs = require('fs');
const response = require('cfn-response');
const aws = require('aws-sdk');
const handlebars = require('handlebars');

aws.config.region = process.env.AWS_REGION;
const s3 = new aws.S3();

exports.handler = function (event, context, cb) {
    console.log(JSON.stringify(event, null, 2));

    try {
        if (event.RequestType !== 'Delete') {
            const files = fs.readdirSync(`${__dirname}/content`);
            Promise.all(files.map((x) => {
                const name = x;
                const temp_text = fs.readFileSync(`${__dirname}/content/${x}`, 'utf-8');
                let text = temp_text;
                // by parsing handlebars during an import of json, it rules out being able to import handlebar syntax.
                // the only know case of using handlebars to change content of an import is using {{photos}}
                // only run handlebars processing if {{photos}} is referenced. All other handlebars syntax should
                // just be imported as handlebars.
                if (temp_text.indexOf('{{photos}}') >= 0) {
                    const temp = handlebars.compile(temp_text);
                    text = temp(event.ResourceProperties);
                }
                return s3.putObject({
                    Bucket: event.ResourceProperties.Bucket,
                    Key: `examples/documents/${name}`,
                    Body: text,
                }).promise();
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
