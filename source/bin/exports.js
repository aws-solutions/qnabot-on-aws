#! /usr/bin/env node
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const config = require('../config.json');

process.env.AWS_PROFILE = config.profile;
process.env.AWS_DEFAULT_REGION = config.region;
const { CloudFormationClient, ListExportsCommand, DescribeStacksCommand } = require('@aws-sdk/client-cloudformation');
const region = require('../config.json').region;
const name = require('./name');
const launch = require('./launch');
const _ = require('lodash');

const cf = new CloudFormationClient({ region });

module.exports = _.memoize(async (stack, options = {}) => {
    if (!stack) {
        const exports = {};
        const listExportsCmd = new ListExportsCommand();
        const listExportsData = await cf.send(listExportsCmd);
        listExportsData.Exports.forEach((exp) => exports[exp.Name] = exp.Value);
        return exports;
    }
    const outputs = {};
    if (config.noStackOutput) {
        return {
            Bucket: config.publicBucket,
            Prefix: config.publicPrefix,
        };
    }
    const result = await new Promise(async (res, rej) => {
        next();
        async function next() {
            try {
                const describeCmd = new DescribeStacksCommand({
                    StackName: name(stack, {}),
                });
                const stackResult = await cf.send(describeCmd);
                const stackStatus = stackResult.Stacks[0].StackStatus;
                if (['CREATE_COMPLETE',
                    'UPDATE_COMPLETE',
                    'UPDATE_ROLLBACK_COMPLETE',
                ].includes(stackStatus)) {
                    res(stackResult);
                } else if ([
                    'CREATE_IN_PROGRESS',
                    'UPDATE_IN_PROGRESS',
                    'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
                    'UPDATE_ROLLBACK_IN_PROGRESS',
                    'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS',
                    'REVIEW_IN_PROGRESS',
                ].includes(stackStatus)) {
                    setTimeout(() => next(), 5 * 1000);
                } else {
                    rej(stackStatus);
                }
            } catch (x) {
                if (x.message.match(/does not exist/)) {
                    await launch.sure(stack, { wait: true });
                    const describeCmd = new DescribeStacksCommand({ StackName: name(stack, {}) });
                    const stackResult = await cf.send(describeCmd);
                    res(stackResult);
                } else {
                    throw x;
                }
            }
        }
    });
    result.Stacks[0].Outputs.forEach((x) => outputs[x.OutputKey] = x.OutputValue);
    return outputs;
}, (stack, options) => stack);

if (!module.parent) {
    (async () => {
        try {
            const exports = await module.exports(process.argv[2], { silent: true, quick: true });
            console.log(JSON.stringify(exports, null, 4));
        } catch (x) {
            console.log(`error${x}`);
        }
    })();
}
