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

const Promise = require('./promise');

exports.SUCCESS = 'SUCCESS';
exports.FAILED = 'FAILED';

exports.send = function (params, cb) {
    return new Promise((res, rej) => {
        const responseBody = JSON.stringify({
            Status: params.responseStatus,
            Reason: params.reason,
            PhysicalResourceId: params.physicalResourceId || params.context.logStreamName,
            StackId: params.event.StackId,
            RequestId: params.event.RequestId,
            LogicalResourceId: params.event.LogicalResourceId,
            Data: params.responseData || {},
        });

        console.log('Response body:\n', responseBody);

        const https = require('https');
        const url = require('url');

        const parsedUrl = url.parse(params.event.ResponseURL);
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
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
            res();
        });

        request.on('error', (error) => {
            console.log(`send(..) failed executing https.request(..): ${error}`);
            rej(error);
        });

        request.write(responseBody);
        request.end();
    });
};
