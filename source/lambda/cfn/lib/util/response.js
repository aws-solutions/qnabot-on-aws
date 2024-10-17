/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
        const { URL } = require('url');
        const parsedUrl = new URL(params.event.ResponseURL);
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
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
