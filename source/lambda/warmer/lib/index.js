/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { URL } = require('url');
const { fromEnv } = require('@aws-sdk/credential-providers');
const { HttpRequest } = require('@smithy/protocol-http');
const { Sha256 } = require('@aws-crypto/sha256-js');
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const { SignatureV4 } = require('@smithy/signature-v4');
const qnabot = require('qnabot/logging');

let credentials;

// using built-in AWS access keys from Lambda environment to create new AWS credentials to sign request
const getCredentials = async function () {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        credentials = await fromEnv('AWS')();
    } else {
        qnabot.warn('Unable to retrieve AWS access keys');
    }
};

const execute = async function (url, region, method, body) {
        const req = new HttpRequest({
            body: body ? JSON.stringify(body) : '',
            hostname : url.hostname,
            method : method || 'GET',
            path : url.pathname + url.search,
            region
        });
        if (body) {
            if (typeof body === 'object') {
                req.body = JSON.stringify(body);
            } else {
                req.body = body;
            }
        } else {
            req.body = '';      
        }
        req.headers['content-type'] = 'application/json';
        req.headers['presigned-expires'] = 'false';
        req.headers['content-length'] = Buffer.byteLength(req.body).toString();
        req.headers['Host'] = url.host;
        const signer = new SignatureV4({
            credentials,
            region,
            service: 'es',
            sha256: Sha256,
        });
       const signed = await signer.sign(req);
       const httpHandler = new NodeHttpHandler();
       const { response } = await httpHandler.handle(signed);
       let res = '';
       for await (const chunk of response.body) {
           res += chunk;
       }
       return res;

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
        const url = new URL(maybeUrl);
        const d1 = new Date();
        const d2 = new Date();
        const time1 = {};
        time1.metric = 'EndPointSetup';
        time1.t1 = d1.getTime();
        time1.t2 = d2.getTime();
        time1.duration = d2.getTime() - d1.getTime();
        qnabot.debug(`${JSON.stringify(time1)}`);
        const e1 = new Date();
        res = await execute(url, region, method, input);
        const e2 = new Date();
        const time2 = {};
        time2.metric = 'TotalESQueryTime';
        time2.t1 = e1.getTime();
        time2.t2 = e2.getTime();
        time2.duration = e2.getTime() - e1.getTime();
        qnabot.debug(`${JSON.stringify(time2)}`);
    }
    return res;
};

module.exports = class warmer {
    async perform(event, context, callback) {
        const count = process.env.REPEAT_COUNT ? parseInt(process.env.REPEAT_COUNT) : 4;
        qnabot.log(`ESWarmer Incoming payload: ${JSON.stringify(event, null, 2)}`);
        try {
            for (let i = 0; i < count; i++) {
                await main();
            }
            qnabot.log('ESWarmer lambda executed sucessfully')
            return ('success');
        } catch (e) {
            qnabot.log('An error was detected in ESWarmer lambda: ', e)
            return ('failure');
        }
    }
};
