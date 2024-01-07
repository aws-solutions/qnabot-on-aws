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

process.env.AWS_PROFILE = require('../config.json').profile;
process.env.AWS_DEFAULT_REGION = require('../config.json').profile;
const { CloudFormationClient, DescribeStacksCommand } = require('@aws-sdk/client-cloudformation');
const region = require('../config.json').region;

const cf = new CloudFormationClient({ region });
const ora = require('ora');
const name = require('./name');

if (require.main === module) {
    wait(process.argv[2], { show: process.argv[3] === 'show' });
}
module.exports = wait;

async function wait(stackname, options) {
    const StackName = name(stackname, {});
    if (options.show) {
        console.log(`Waiting on stack:${StackName}`);
    }
    const spinner = new Spinner(options.show);
    try {
        while (true) {
            const describeCmd = new DescribeStacksCommand({ StackName: options.Id || StackName });
            const response = await cf.send(describeCmd);
            const status = response.Stacks[0].StackStatus;
            spinner.update(status);
            if (['UPDATE_COMPLETE',
                'CREATE_COMPLETE',
                'UPDATE_ROLLBACK_COMPLETE',
                'DELETE_COMPLETE',
            ].includes(status)) {
                spinner.succeed(`${StackName}:${status}`);
                return;
            } if ([
                'UPDATE_IN_PROGRESS',
                'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS',
                'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
                'UPDATE_ROLLBACK_IN_PROGRESS',
                'ROLLBACK_IN_PROGRESS',
                'DELETE_IN_PROGRESS',
                'CREATE_IN_PROGRESS',
            ].includes(status)) {
                await new Promise((resolve) => setTimeout(resolve, 5000));
            } else {
                spinner.fail(`${StackName}:${status}`);
                throw new Error(status);
            }
        }
    } catch (err) {
        spinner.fail(`${StackName}:${err.message}`);
        throw err;
    }
}

function Spinner(show) {
    if (show) {
        this.spinner = ora({
            text: 'Getting Stack Status',
            spinner: 'bouncingBar',
        }).start();
        this.spinner.color = 'yellow';
        this.update = function (txt) {
            this.spinner.text = txt;
        };
        this.succeed = this.spinner.succeed.bind(this.spinner);
        this.fail = this.spinner.fail.bind(this.spinner);
    } else {
        this.update = () => {};
        this.succeed = () => {};
        this.fail = () => {};
    }
}
