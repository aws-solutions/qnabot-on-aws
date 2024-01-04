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

const { S3Client, DeleteObjectsCommand, ListObjectVersionsCommand } = require('@aws-sdk/client-s3');

const region = process.env.AWS_REGION;
const s3Client = new S3Client({
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

function send(event, context, responseStatus, responseData, physicalResourceId, noEcho) {
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

async function Delete(params) {
    async function next() {
        const objects = await s3Client.send(new ListObjectVersionsCommand({
            Bucket: params.Bucket,
        }));
        const files = [...(objects.Versions || []), ...(objects.DeleteMarkers || [])];
        console.log("Files: ", files);

        const keys = files.map((file) => ({
            Key: file.Key,
            VersionId: file.VersionId,
        }));
        console.log('going to delete', keys);

        if (keys && keys.length > 0) {
            s3Client.send(new DeleteObjectsCommand({
                Bucket: params.Bucket,
                Delete: {
                    Objects: keys,
                },
            }));
            await next();
        }
    }
    await next();
}

exports.handler = async function (event, context) {
    console.log(JSON.stringify(event, null, 2));

    if (event.RequestType === 'Delete') {
        try {
            await Delete(event.ResourceProperties);
            await send(event, context, SUCCESS);
        } catch (e) {
            console.log(e);
            await send(event, context, FAILED);
        }
    } else {
        await send(event, context, SUCCESS);
    }
    context.done();
};
