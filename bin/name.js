#! /usr/bin/env node
const fs = require('fs');
const _ = require('lodash');
const config = require('../config.json');

process.env.AWS_PROFILE = config.profile;
process.env.AWS_DEFAULT_REGION = config.region;

module.exports = run;

if (require.main === module) {
    const argv = require('commander');
    let ran;
    const args = argv.version('1.0')
        .name(process.argv[1].split('/').reverse()[0])
        .arguments('[stack]')
        .usage('[stack] [options]')
        .option('--inc', 'increment value')
        .option('-s --set <value>', 'set the value')
        .option('-n --namespace <name>', 'stack namespace')
        .option('-p --prefix', 'get stacks prefix')
        .action((stack, options) => {
            if (stack || options.prefix) ran = true;
            console.log(run(stack, options));
        })
        .parse(process.argv);
    if (!ran) {
        argv.outputHelp();
    }
}

function run(stack, options = {}) {
    const namespace = options.namespace || config.namespace;
    let increments;
    try {
        increments = require('../build/inc.json');
    } catch (e) {
        try {
            increments = require('./.inc.json');
            fs.unlinkSync(`${__dirname}/.inc.json`);
            fs.writeFileSync(`${__dirname}/../build/inc.json`, JSON.stringify(increments, null, 2));
        } catch (e) {
            increments = {};
        }
    }

    const stackname = stack.replace('/', '-');
    const full = `${namespace}-${stackname}`;
    const path = `["${config.profile}"].["${namespace}"].["${stackname}"]`;

    if (options.hasOwnProperty('set')) {
        increment = options.set;
        set(increment);
    } else {
        increment = _.get(increments, path, 0);
    }

    if (options.inc) {
        set(++increment);
    }

    config.stackNamePrefix = config.stackNamePrefix ? config.stackNamePrefix : 'QNA';

    if (options.prefix) {
        return `${config.stackNamePrefix}-${full}`;
    }
    return `${config.stackNamePrefix}-${full}-${increment}`;

    function set(value) {
        _.set(increments, path, parseInt(value));
        fs.writeFileSync(`${__dirname}/../build/inc.json`, JSON.stringify(increments, null, 2));
    }
}
