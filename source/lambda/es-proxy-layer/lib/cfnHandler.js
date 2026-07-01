/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

/**
 * Minimal CFN custom resource handler for es-proxy-layer/lib/cfn.js.
 * Replaces cfn-lambda for the ESProxy resource (OpenSearch index management).
 *
 * Handles async Create/Update/Delete functions that return {PhysicalResourceId, FnGetAttrsDataObj}.
 */

const https = require('node:https');
const { URL } = require('node:url');
const qnabot = require('qnabot/logging');

/**
 * Send CFN response via HTTPS PUT to ResponseURL.
 */
function sendResponse(event, status, physicalId, data, reason) {
    return new Promise((resolve, reject) => {
        const responseBody = JSON.stringify({
            Status: status,
            Reason: reason || 'See CloudWatch logs',
            PhysicalResourceId: physicalId || event.PhysicalResourceId || [event.StackId, event.LogicalResourceId, event.RequestId].join('/'),
            StackId: event.StackId,
            RequestId: event.RequestId,
            LogicalResourceId: event.LogicalResourceId,
            Data: data || {},
        });

        const parsedUrl = new URL(event.ResponseURL);
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'PUT',
            headers: { 'content-type': '', 'content-length': responseBody.length },
        };

        const req = https.request(options, (res) => {
            qnabot.log(`CFN response sent: ${res.statusCode}`);
            resolve();
        });
        req.on('error', reject);
        req.write(responseBody);
        req.end();
    });
}

/**
 * Strip ServiceToken from ResourceProperties.
 */
function stripServiceToken(props) {
    if (!props) return props;
    const result = { ...props };
    delete result.ServiceToken;
    return result;
}

/**
 * Deep-equal for NoUpdate detection.
 */
function deepEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Dispatch CFN request to the appropriate resource handler.
 */
async function dispatch(resource, event, physicalId) {
    const requestType = event.RequestType;
    const params = stripServiceToken(event.ResourceProperties);
    const oldParams = stripServiceToken(event.OldResourceProperties);

    if (requestType === 'Create') {
        return resource.Create(params);
    }
    if (requestType === 'Update') {
        if (deepEqual(params, oldParams)) {
            return { PhysicalResourceId: physicalId, FnGetAttrsDataObj: {} };
        }
        return resource.Update(physicalId, params, oldParams);
    }
    if (requestType === 'Delete') {
        try {
            return await resource.Delete(physicalId, params);
        } catch (err) {
            // Delete failsafe: always succeed
            qnabot.log(`CFN Delete handler error (sending SUCCESS anyway): ${err}`);
            return { PhysicalResourceId: physicalId, FnGetAttrsDataObj: {} };
        }
    }
    throw new Error(`Unrecognized RequestType: ${requestType}`);
}

/**
 * Calls context.done() if available — resolves the Promise in proxy-es/resource.js.
 */
function callDone(context) {
    if (context && typeof context.done === 'function') context.done();
}

/**
 * Main handler for ESProxy resource.
 * @param {object} resource - object with async Create(params), Update(ID, params, oldparams), Delete(ID, params)
 * @param {object} event - CloudFormation custom resource event
 * @param {object} context - Lambda context (context.done() must be called to resolve proxy-es/resource.js Promise)
 */
async function cfnHandler(resource, event, context) {
    const physicalId = event.PhysicalResourceId;
    try {
        const result = await dispatch(resource, event, physicalId);
        await sendResponse(event, 'SUCCESS', result.PhysicalResourceId, result.FnGetAttrsDataObj);
    } catch (err) {
        qnabot.error('CFN handler error:', err);
        try {
            await sendResponse(event, 'FAILED', physicalId, {}, err.message || String(err));
        } catch (sendErr) {
            qnabot.error('Failed to send CFN FAILED response:', sendErr);
        }
    } finally {
        callDone(context);
    }
}

module.exports = cfnHandler;
