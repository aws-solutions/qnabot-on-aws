#! /usr/bin/env node
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const config = require('../config.json');

process.env.AWS_PROFILE = config.profile;
process.env.AWS_DEFAULT_REGION = config.region;
const { CloudFormationClient, CreateStackCommand, UpdateStackCommand, DescribeStacksCommand, DeleteStackCommand } = require('@aws-sdk/client-cloudformation');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const { region } = require('../config.json');
const _ = require('lodash');
const fs = require('fs');

const cf = new CloudFormationClient({ region });
const build = require('./build');
const check = require('./check');
const argv = require('commander');
const name = require('./name');
const wait = require('./wait');

const s3 = new S3Client({ region });

if (require.main === module) {
    const args = argv.version('1.0')
        .description('Manage Cloudformation stacks. stack name is path to template file relative to /templates')
        .name('npm run stack')
        .arguments('[stack] [op] [options]')
        .option('-v, --verbose', 'print additional debuging information')
        .option('-d, --dry-run', 'run command but do not launch any stacks')
        .option('--no-check', 'do not check stack syntax')
        .option('-q --silent', 'do output information')
        .option('--operation <op>', 'the opteration to do')
        .option('--input <input>', 'input template')
        .option('--stack-name <StackName>', 'stack name of the launched template')
        .option('--no-wait', 'do not wait for stack to complete')
        .option('--no-interactive', 'omit interactive elements of output (spinners etc.)')
        .on('--help', () => {
            log(`
  Operations:

    up:         launch a stack
    update:     update a stack
    down:       terminate a stack
    restart:    terminate a stack then launch a new one
    make-sure:  check if stack is up, if not then launch one

  Examples:
    npm run stack dev/bootstrap up -- --no-wait --verbose
    npm run stack -- --input ./test/cfn --operation make-sure --dry-run
`, {});
        })
        .parse(process.argv);

    const options = argv.opts();
    const stack = !options.input ? argv.args[0] : argv.input.split('/')
        .reverse()
        .filter((x) => x)
        .slice(0, 2)
        .reverse()
        .join('-')
        .split('.')[0];
    const op = options.operation || (options.input ? argv.args[0] : argv.args[1]);
    try {
        if (stack && op) {
            switch (op) {
            case 'up':
                up(stack, options || {});
                break;
            case 'update':
                update(stack, options || {});
                break;
            case 'down':
                down(stack, options || {});
                break;
            case 'restart':
                log('restarting stack', options || {});
                down(stack, options || {}).then(() => up(stack, options || {}));
                break;
            case 'make-sure':
                sure(stack, options);
                break;
            default:
                argv.outputHelp();
            }
        } else {
            argv.outputHelp();
        }
    } catch (e) {
        log(e.message, options);
    }
}
async function syntax(stack, options) {
    if (options.check) {
        try {
            await check(stack, options);
            log('Template Valid', options);
        } catch (e) {
            log(e.message, options);
        }
    }
}
async function up(stack, options) {
    await build({
        stack,
        input: options.input,
        silent: options.silent,
    });
    try {
        const StackName = options.stackName ? options.stackName : name(stack, { inc: true });
        log(`launching stack:${stack}`, options);
        if (!options.dryRun) {
            const template = fs.readFileSync(
                `${__dirname}/../build/templates/${stack}.json`,
                'utf-8',
            );

            let create;
            if (Buffer.byteLength(template) < 51200) {
                const createCmd = new CreateStackCommand({
                    StackName,
                    Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
                    DisableRollback: true,
                    TemplateBody: template,
                });
                create = await cf.send(createCmd);
            } else {
                const exp = await bootstrap();
                const bucket = exp.Bucket;
                const prefix = exp.Prefix;
                const url = `https://${bucket}.s3.${region}.amazonaws.com/${prefix}/templates/${stack}.json`;
                const params = {
                    Bucket: bucket,
                    Key: `${prefix}/templates/${stack}.json`,
                    Body: template,
                };
                const putCmd = new PutObjectCommand(params)
                await s3.send(putCmd);
                const createCmd = new CreateStackCommand({
                    StackName,
                    Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
                    DisableRollback: true,
                    TemplateURL: url,
                });
                create = await cf.send(createCmd);
            }

            log(`stackname: ${StackName}`, options);
            log(`stackId: ${create.StackId}`, options);
            if (options.wait) {
                return wait(stack, { show: !options.silent });
            }
        }
    } catch (e) {
        log(`failed:${e}`, options);
        process.exit(1);
    }
}
async function update(stack, options) {
    await build({
        stack,
        input: options.input,
        silent: options.silent,
    });
    try {
        const StackName = options.stackName ? options.stackName : name(stack);
        log(`updating stack:${stack}`, options);
        if (!options.dryRun) {
            const template = fs.readFileSync(`${__dirname}/../build/templates/${stack}.json`, 'utf-8');
            let start;
            if (Buffer.byteLength(template) < 51200) {
                const updateParams = {
                    StackName,
                    Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
                    TemplateBody: template,
                };
                const updateCmd = new UpdateStackCommand(updateParams);
                start = await cf.send(updateCmd);
            } else {
                const exp = await bootstrap();
                const bucket = exp.Bucket;
                const prefix = exp.Prefix;
                const url = `https://${bucket}.s3.${region}.amazonaws.com/${prefix}/templates/${stack}.json`;
                console.log(url);
                const params = {
                    Bucket: bucket,
                    Key: `${prefix}/templates/${stack}.json`,
                    Body: template,
                };
                const putCmd = new PutObjectCommand(params)
                await s3.send(putCmd);
                const updateParams = {
                    StackName,
                    Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
                    TemplateURL: url,
                };
                const updateCmd = new UpdateStackCommand(updateParams)
                start = await cf.send(updateCmd);
            }
            const result = await start;
            log(`stackname: ${StackName}`, options);
            log(`stackId: ${result.StackId}`, options);
            if (options.wait) {
                return wait(stack, { show: !options.silent });
            }
        }
    } catch (err) {
        log(`failed${err}`, options);
        process.exit(1);
    }
}
async function down(stack, options) {
    const StackName = options.stackName ? options.stackName : name(stack);
    log('terminating stack', options);
    if (options.dryRun) {
        return;
    }
    try {
        const describeCmd = new DescribeStacksCommand({
            StackName,
        });
        const down = await cf.send(describeCmd);
        const id = down.Stacks[0].StackId;
        const deleteCmd = new DeleteStackCommand({
            StackName: id,
        });
        await cf.send(deleteCmd);
        if (options.wait) {
            return wait(stack, {
                Id: id,
                show: options.interactive,
            });
        }
    } catch (e) {
        console.log(e);
        if (!_.get(e, 'message', '').match(/.*does not exist$/)) {
            log(e, options);
            process.exit(1);
        }
    }
}

async function sure(stack, options = {}) {
    const StackName = options.stackName ? options.stackName : name(stack);
    log(`making sure stack ${stack} is up`, options);
    try {
        const describeCmd = new DescribeStacksCommand({ StackName });
        await cf.send(describeCmd);
        await wait(stack, { show: options.interactive && !options.silent });
        log(`${stack} is up as ${StackName}`, options);
    } catch (e) {
        if (_.get(e, 'message', '').match(/.*does not exist$/)) {
            log('Stack does not exist', options);
            return up(stack, options);
        }
        throw e;
    }
}

function log(message, options) {
    if (!options.silent) {
        console.log(message);
    }
}

async function bootstrap() {
    const outputs = {};
    const describeCmd = new DescribeStacksCommand({
        StackName: name('dev/bootstrap', {}),
    });
    const tmp = await cf.send(describeCmd);
    tmp.Stacks[0].Outputs.forEach((x) => outputs[x.OutputKey] = x.OutputValue);
    return outputs;
}
exports.up = up;
exports.down = down;
exports.sure = sure;
exports.update = update;
