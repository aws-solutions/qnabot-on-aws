#! /usr/bin/env node
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

process.env.AWS_PROFILE = require('../config.json').profile;
process.env.AWS_DEFAULT_REGION = require('../config.json').region;
const chalk = require('chalk');
const stringify = require('json-stringify-pretty-compact');
const check = require('./check');
const fs = require('fs').promises;

if (!module.parent) {
    const argv = require('commander');
    const args = argv.version('1.0')
        .name(process.argv[1].split('/').reverse()[0])
        .option('--verbose', 'silent')
        .option('--stack <stack>', 'stack to build')
        .option('--input <input>', 'input file')
        .option('--output <output>', 'output file')
        .parse(process.argv);

    const options = argv.opts();
    if (options.stack || (options.input && options.output)) {
        create({
            silent: !options.verbose,
            input: options.input,
            output: options.output,
            stack: options.stack,
        });
    } else {
        console.log('error: required options not specified');
        argv.outputHelp();
        process.exit(1);
    }
}
module.exports = create;
async function create(options) {
    const { stack } = options;
    log(`building ${options.stack || options.input}`, stack, !options.silent);
    const file = options.input || `${__dirname}/../templates/${stack}`;
    const output = options.output || `${__dirname}/../build/templates/${stack}.json`;
    try {
        const temp = await require(file);
        const template_string = typeof temp === 'object' ? JSON.stringify(temp) : temp;

        log(`writing to ${output}`, !options.silent);

        await fs.writeFile(output, stringify(JSON.parse(template_string)));
        await check(stack, { file: output });
        log(chalk.green(`${stack} is valid`), !options.silent);
        log(`finished building ${stack}`, !options.silent);
    } catch (error) {
        log(chalk.red(`${stack} failed:${error}`), !options.silent);
        process.exit(1)
    }
}

function log(message, show) {
    if (show) { console.log(message); }
}
