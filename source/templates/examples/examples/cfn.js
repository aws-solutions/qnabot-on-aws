/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const fs = require('fs');
const response = require('cfn-response');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');
const region = process.env.AWS_REGION;
const s3 = new S3Client(customSdkConfig('C018', { region }));

async function sendCfnResponse(event, context, status) {
    if (!event.ResponseURL) return;
    
    return new Promise((resolve, reject) => {
        response.send(event, context, status, {}, undefined, (error) => {
            if (error) {
                console.error('Error sending response:', error);
                reject(error);
            } else {
                console.log('Response sent successfully');
                resolve();
            }
        });
    });
}

async function uploadExamples(bucket) {
    const files = fs.readdirSync(`${__dirname}/examples`);
    const uploads = files.map((filename) => {
        const text = fs.readFileSync(`${__dirname}/examples/${filename}`, 'utf-8');
        const params = {
            Bucket: bucket,
            Key: `examples/documents/${filename}`,
            Body: text,
        };
        return s3.send(new PutObjectCommand(params));
    });
    
    return Promise.all(uploads);
}

exports.handler = async (event, context) => {
    console.log(JSON.stringify(event, null, 2));

    try {
        if (event.RequestType !== 'Delete') {
            const results = await uploadExamples(event.ResourceProperties.Bucket);
            console.log(results);
        }
        
        await sendCfnResponse(event, context, response.SUCCESS);
    } catch (e) {
        console.log(e);
        await sendCfnResponse(event, context, response.FAILED);
        throw e;
    }
};
