/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const { Lambda } = require('@aws-sdk/client-lambda');
const customSdkConfig = require('sdk-config/customSdkConfig');
const qnabot = require('qnabot/logging');
const region = process.env.AWS_REGION || 'us-east-1';

// resolves Lambda function name for bundled example lambdas refernced in env.
function getLambdaName(lambdaRef) {
    const match = lambdaRef.match(/QNA:(.*)/);
    if (match) {
        return process.env[match[1]] || lambdaRef;
    }
    return lambdaRef;
}
// used to invoke either chaining rule lambda, or Lambda hook

async function invokeLambda(lambdaRef, req, res) {
    const lambdaName = getLambdaName(lambdaRef);
    qnabot.log('Calling Lambda:', lambdaName);
    const event = { req, res };
    const lambda = new Lambda(customSdkConfig('C024', { region }));
    const lambdares = await lambda
        .invoke({
            FunctionName: lambdaName,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(event),
        });
    let payload = lambdares.Payload;
    
    try {
        const payloadObj = Buffer.from(payload).toString();
        payload = JSON.parse(payloadObj);
        if (_.get(payload, 'req') && _.get(payload, 'res')) {
            req = _.get(payload, 'req');
            res = _.get(payload, 'res');
        }
    } catch (e) {
        // response is not JSON - noop
    }
    qnabot.log('Lambda returned payload: ', payload);
    return [req, res, payload];
}
exports.invokeLambda = invokeLambda;
