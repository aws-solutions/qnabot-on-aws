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

const url = require('url');
const AWS = require('aws-sdk');
const qnabot = require('qnabot/logging');

let credentials;

const getMetadataCredentials = async function () {
    credentials = new AWS.EC2MetadataCredentials();
    return await credentials.getPromise();
};

const getCredentials = async function () {
    const profile = process.env.AWS_PROFILE;
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && !profile) {
        credentials = new AWS.EnvironmentCredentials('AWS');
        return;
    }

    if (!profile) {
        try {
            await getMetadataCredentials();
            return;
        } catch (err) {
            console.error('Unable to access metadata service.', err.message);
        }
    }

    credentials = new AWS.SharedIniFileCredentials({
        profile: profile || 'default',
        // the filename to use when loading credentials
        // use of AWS_SHARED_CREDENTIALS_FILE environment variable
        // see also 'The Shared Credentials File' http://docs.aws.amazon.com/cli/latest/topic/config-vars.html
        filename: process.env.AWS_SHARED_CREDENTIALS_FILE,
    });
    return await credentials.getPromise();
};

const execute = function (endpoint, region, path, method, body) {
    return new Promise((resolve, reject) => {
        const req = new AWS.HttpRequest(endpoint);
        req.method = method || 'GET';
        req.path = path;
        req.region = region;

        if (body) {
            if (typeof body === 'object') {
                req.body = JSON.stringify(body);
            } else {
                req.body = body;
            }
        }

        req.headers['presigned-expires'] = false;
        req.headers['content-type'] = 'application/json';
        req.headers['content-length'] = Buffer.byteLength(req.body);
        req.headers.Host = endpoint.host;

        const signer = new AWS.Signers.V4(req, 'es');
        signer.addAuthorization(credentials, new Date());

        const send = new AWS.NodeHttpClient();
        send.handleRequest(req, null, (httpResp) => {
            let body = '';
            httpResp.on('data', (chunk) => {
                body += chunk;
            });
            httpResp.on('end', (chunk) => {
                resolve(body);
            });
        }, (err) => {
            qnabot.log(`Error: ${err}`);
            reject(err);
        });
    });
};

const main = async function () {
    let res = '';
    const proto = 'http';
    const maybeUrl = `${proto}://${process.env.TARGET_URL}/${process.env.TARGET_INDEX}/${process.env.TARGET_PATH}`;
    const method = 'GET';
    const region = process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';

    await getCredentials();

    const input = '';
    if (maybeUrl && maybeUrl.indexOf('http') === 0) {
        const uri = url.parse(maybeUrl);
        const d1 = new Date();
        const endpoint = new AWS.Endpoint(uri.host);
        const d2 = new Date();
        const time1 = {};
        time1.metric = 'EndPointSetup';
        time1.t1 = d1.getTime();
        time1.t2 = d2.getTime();
        time1.duration = d2.getTime() - d1.getTime();
        qnabot.log(`${JSON.stringify(time1)}`);
        const e1 = new Date();
        res = await execute(endpoint, region, uri.path, method, input);
        const e2 = new Date();
        const time2 = {};
        time2.metric = 'TotalESQueryTime';
        time2.t1 = e1.getTime();
        time2.t2 = e2.getTime();
        time2.duration = e2.getTime() - e1.getTime();
        qnabot.log(`${JSON.stringify(time2)}`);
    }
    return res;
};

module.exports = class warmer {
    async perform(event, context, callback) {
        const count = process.env.REPEAT_COUNT ? parseInt(process.env.REPEAT_COUNT) : 4;
        qnabot.log(`Incoming payload: ${JSON.stringify(event, null, 2)}`);
        try {
            for (let i = 0; i < count; i++) {
                qnabot.log(`main ${i}`);
                const res = await main();
                qnabot.log(res);
            }
            return ('success');
        } catch (e) {
            qnabot.log(`Error detected ${e}`);
            return ('failure');
        }
    }
};
