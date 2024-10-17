/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const fs = require('fs');
const response = require('cfn-response');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');
const handlebars = require('handlebars');

const region = process.env.AWS_REGION;
const s3 = new S3Client(customSdkConfig('C018', { region }));

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
