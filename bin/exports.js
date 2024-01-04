#! /usr/bin/env node
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
const config = require('../config.json');

process.env.AWS_PROFILE = config.profile;
process.env.AWS_DEFAULT_REGION = config.profile;
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
