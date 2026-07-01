/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

/**
 * Custom replacement for the cfn-lambda npm package.
 *
 * cfn-lambda is an unmaintained package (5+ years without updates) that pulls in
 * aws-sdk v2 as a transitive dependency. This replacement implements the same
 * interface used by QnABot's CFN resource handlers, eliminating the dependency.
 *
 * Supported handler patterns:
 *   Callback:  handler.Create(params, reply) / handler.Update(ID, params, oldparams, reply) / handler.Delete(ID, params, reply)
 *   Async:     handler.AsyncCreate(params) / handler.AsyncUpdate(ID, params, oldparams) / handler.AsyncDelete(ID, params)
 *
 * The reply(err, physicalId, data) callback sends the CFN response via HTTPS PUT.
 */

const response = require('./util/response');

/**
 * Deep-equal comparison for NoUpdate detection (equivalent to cfn-lambda's JSONDeepEquals).
 */
function deepEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Strip ServiceToken from ResourceProperties (cfn-lambda does this before passing to handlers).
 */
function stripServiceToken(props) {
    if (!props) return props;
    const result = { ...props };
    delete result.ServiceToken;
    return result;
}

/**
 * Build the reply callback that sends the CFN response.
 */
function buildReply(event, context, physicalIdFallback) {
    return function reply(err, physicalId, data) {
        const pid = physicalId || physicalIdFallback || [event.StackId, event.LogicalResourceId, event.RequestId].join('/');
        const params = err ? {
            event,
            context,
            responseStatus: response.FAILED,
            reason: err.toString ? err.toString() : String(err),
            physicalResourceId: pid,
            responseData: data || {},
        } : {
            event,
            context,
            responseStatus: response.SUCCESS,
            physicalResourceId: pid,
            responseData: data || {},
        };
        return response.send(params).then(() => {
            if (context && typeof context.done === 'function') context.done();
        }).catch((sendErr) => {
            console.log(`cfnHandler: Failed to send CFN response: ${sendErr}`);
            if (context && typeof context.done === 'function') context.done();
        });
    };
}

/**
 * Main handler — equivalent to cfnLambda(resourceDefinition)(event, context).
 *
 * @param {object} resourceDefinition - Handler class instance with Create/Update/Delete methods
 * @param {object} event - CloudFormation custom resource event
 * @param {object} context - Lambda context
 */
function cfnHandler(resourceDefinition, event, context) {
    const requestType = event.RequestType;
    const params = stripServiceToken(event.ResourceProperties);
    const oldParams = stripServiceToken(event.OldResourceProperties);
    const physicalId = event.PhysicalResourceId;
    const reply = buildReply(event, context, physicalId);

    // Bridge Async handlers to callback pattern (same as cfn-lambda AsyncCreate/AsyncUpdate/AsyncDelete)
    if (resourceDefinition.AsyncCreate && !resourceDefinition.Create) {
        resourceDefinition.Create = (p, cb) => resourceDefinition.AsyncCreate(p).then(r => cb(null, r?.PhysicalResourceId, r?.FnGetAttrsDataObj)).catch(cb);
    }
    if (resourceDefinition.AsyncUpdate && !resourceDefinition.Update) {
        resourceDefinition.Update = (id, p, op, cb) => resourceDefinition.AsyncUpdate(id, p, op).then(r => cb(null, r?.PhysicalResourceId, r?.FnGetAttrsDataObj)).catch(cb);
    }
    if (resourceDefinition.AsyncDelete && !resourceDefinition.Delete) {
        resourceDefinition.Delete = (id, p, cb) => resourceDefinition.AsyncDelete(id, p).then(r => cb(null, r?.PhysicalResourceId, r?.FnGetAttrsDataObj)).catch(cb);
    }

    if (requestType === 'Create') {
        return resourceDefinition.Create(params, reply);
    }

    if (requestType === 'Update') {
        // NoUpdate: skip handler when params unchanged (same as cfn-lambda JSONDeepEquals behavior)
        if (deepEqual(params, oldParams)) {
            return reply(null, physicalId);
        }
        return resourceDefinition.Update(physicalId, params, oldParams, reply);
    }

    if (requestType === 'Delete') {
        // Delete failsafe: always send SUCCESS even on handler error (same as cfn-lambda behavior)
        const safeReply = (err, id, data) => {
            if (err) {
                console.log(`cfnHandler: Delete handler returned error, sending SUCCESS anyway: ${err}`);
                return reply(null, physicalId);
            }
            return reply(null, id, data);
        };
        return resourceDefinition.Delete(physicalId, params, safeReply);
    }

    console.log(`cfnHandler: Unrecognized RequestType: ${requestType}`);
    return reply(`Unrecognized RequestType: ${requestType}`);
}

module.exports = cfnHandler;
