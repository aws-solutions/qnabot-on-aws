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

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const qnabot = require('qnabot/logging');

exports.decode = function (idtoken) {
    const decoded = jwt.decode(idtoken, { complete: true });
    if (!decoded) { return null; }
    let { payload } = decoded;
    // try parse the payload
    if (typeof payload === 'string') {
        try {
            const obj = JSON.parse(payload);
            if (obj !== null && typeof obj === 'object') {
                payload = obj;
            }
        } catch (e) { }
    }
    return {
        header: decoded.header,
        payload,
        signature: decoded.signature,
    };
};

async function getSigningKey(kid, url) {
    const client = jwksClient({
        jwksUri: url,
    });
    // locate IdP for the token from list of trusted IdPs
    let signingKey = '';
    try {
        const key = await client.getSigningKey(kid);
        signingKey = key.getPublicKey();
    } catch (e) {
    }
    return signingKey;
}

function verifyToken(idtoken, signingKey) {
    // verify that the token is valid and not expired
    try {
        jwt.verify(idtoken, signingKey);
        return true;
    } catch (e) {
        qnabot.log('idaccesstoken is not valid:', e);
        return false;
    }
}

exports.verify = async function (idtoken, kid, urls) {
    for (const url of urls) {
    // locate IdP for the token from list of trusted IdPs
        qnabot.log('checking:', url);
        const signingKey = await getSigningKey(kid, url);
        if (signingKey) {
            qnabot.log('token kid matches:', url);
            qnabot.log('verifying token');
            if (verifyToken(idtoken, signingKey)) {
                return url;
            }
        }
    }
    return false;
};
