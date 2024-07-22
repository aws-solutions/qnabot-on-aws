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

const axios = require('axios');
const { fromEnv } = require('@aws-sdk/credential-providers');
const { sign } = require('aws4');
const { URL } = require('url');
const qnabot = require('qnabot/logging');

function next(count, res, rej, request) {
    if (count <= 0) {
        return rej('Retry limits exceeded. See logs for additional information.');
    }
    qnabot.log(`Tries left:${count}`);
    const { credentials } = fromEnv();
    const signed = sign(request, credentials);
    axios(signed)
        .then(response => {
            qnabot.log(response.status)
            res(response.data)
        })
        .catch((error) => {
        // if the server responded with an actual HTTP response then log and retry on 5xx codes
            if (error.response) {
                qnabot.log(error.response.data);
                qnabot.log(error.response.status);
                if (error.response.status >= 500) {
                    qnabot.log('Received 500 error code, retrying...');
                    setTimeout(() => next(--count, res, rej, request), 1000);
                } else {
                // any non 5xx failure codes should be rejected as normal
                    rej(error);
                }
            }
            // in some cases, the axios client does not return a fully formatted response object
            // in those cases, the message property may contain useful debugging information
            else if (error.message) {
                qnabot.log(error.message);
                rej(error);
            } else {
                rej(error);
            }
        });
}

module.exports = function (opts) {
    const url = new URL(opts.url);
    const request = {
        host: url.hostname,
        method: opts.method.toUpperCase(),
        url: url.href,
        path: url.pathname + url.search,
        headers: opts.headers || {},
    };
    request.headers.Host = request.host;
    if (opts.body) {
        // if the JSON body being passed to OpenSearch is an array,
        // then let's convert it to a newline delmited JSON string (ndjson)
        if (Array.isArray(opts.body)) {
            opts.body = `${opts.body.map(JSON.stringify).join('\n')}\n`;
            request.headers['Content-Type'] = 'application/x-ndjson';
        }
        // stringify the body object into JSON if not already a string
        else if (typeof opts.body !== 'string') {
            opts.body = JSON.stringify(opts.body);
        }

        // if content type is not set, default to application/json
        if (!request.headers['Content-Type'] && !request.headers['content-type']) {
            request.headers['Content-Type'] = 'application/json';
        }
        request.body = opts.body;
        request.data = opts.body;
    }
    qnabot.log('request (first 2000 chars):', JSON.stringify(request, null, 2).slice(0, 2000));

    return new Promise((res, rej) => {
        next(10, res, rej, request);
    })
};
