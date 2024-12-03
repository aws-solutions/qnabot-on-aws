/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');

const region = process.env.AWS_REGION;
const client = new S3Client({
    customUserAgent: [
        [`AWSSOLUTION/${process.env.SOLUTION_ID}/${process.env.SOLUTION_VERSION}`],
        [`AWSSOLUTION-CAPABILITY/${process.env.SOLUTION_ID}-C023/${process.env.SOLUTION_VERSION}`],
    ],
    region,
});

const SUCCESS = 'SUCCESS';
const FAILED = 'FAILED';
const https = require('https');
const { URL } = require('url');

async function send(event, context, responseStatus, responseData, physicalResourceId, noEcho) {
    return new Promise((resolve, reject) => {
        const responseBody = JSON.stringify({
            Status: responseStatus,
            Reason: `See the details in CloudWatch Log Stream: ${context.logStreamName}`,
            PhysicalResourceId: physicalResourceId || context.logStreamName,
            StackId: event.StackId,
            RequestId: event.RequestId,
            LogicalResourceId: event.LogicalResourceId,
            NoEcho: noEcho || false,
            Data: responseData,
        });

        console.log('Response body:\n', responseBody);

        const parsedUrl = new URL(event.ResponseURL);

        const options = {
            hostname: parsedUrl.hostname,
            port: 443,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'PUT',
            headers: {
                'content-type': '',
                'content-length': responseBody.length,
            },
        };

        const request = https.request(options, (response) => {
            console.log(`Status code: ${response.statusCode}`);
            console.log(`Status message: ${response.statusMessage}`);
            response.on('end', () => {
                resolve();
            });
        });

        request.on('error', (error) => {
            console.log(`send(..) failed executing https.request(..): ${error}`);
            reject(error);
        });

        request.write(responseBody);
        request.end();
    });
}

exports.handler = async function (event, context) {
    console.log(JSON.stringify(event, null, 2));
    if (event.RequestType !== 'Delete') {
        const params = {
            Bucket: event.ResourceProperties.Bucket,
            Key: event.ResourceProperties.Key,
        };
        const headObjCmd = new HeadObjectCommand(params);
        try {
            const result = await client.send(headObjCmd);
            await send(event, context, SUCCESS, {
                version: result.VersionId ? result.VersionId : 1,
            });
        } catch (e) {
            console.log(e);
            await send(event, context, FAILED);
        }
    } else {
        await send(event, context, SUCCESS);
    }
    context.done();
};
