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

const SUCCESS = 'SUCCESS';
const FAILED = 'FAILED';
const https = require('https');
const url = require('url');

function send(event, context, responseStatus, responseData, physicalResourceId, noEcho) {
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

    const parsedUrl = url.parse(event.ResponseURL);
    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: 'PUT',
        headers: {
            'content-type': '',
            'content-length': responseBody.length,
        },
    };

    const request = https.request(options, (response) => {
        console.log(`Status code: ${response.statusCode}`);
        console.log(`Status message: ${response.statusMessage}`);
        context.done();
    });

    request.on('error', (error) => {
        console.log(`send(..) failed executing https.request(..): ${error}`);
        context.done();
    });

    request.write(responseBody);
    request.end();
}
