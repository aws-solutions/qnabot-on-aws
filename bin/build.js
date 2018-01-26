#! /usr/bin/env node
var Promise=require('bluebird')
var fs=Promise.promisifyAll(require('fs'))
process.env.AWS_PROFILE=require('../config').profile
process.env.AWS_DEFAULT_REGION=require('../config').profile
var aws=require('aws-sdk')
var chalk=require('chalk')
aws.config.setPromisesDependency(Promise)
aws.config.region=require('../config').region
var cf=new aws.CloudFormation()
var s3=new aws.S3()
var stringify=require("json-stringify-pretty-compact")
var check=require('./check')
var fs = require('fs');
var outputs=require('./exports')

if(!module.parent){
    var argv=require('commander')
    var ran
    var args=argv.version('1.0')
        .name(process.argv[1].split('/').reverse()[0])
        .option('--verbose',"silent")
        .option('--stack <stack>',"stack to build")
        .option('--input <input>',"input file")
        .option('--output <output>',"output file")
        .parse(process.argv)

    if( args.stack || (args.input && args.output)){
        create({
            silent:!args.verbose,
            input:args.input,
            output:args.output,
            stack:args.stack
        })
    }else{
        argv.outputHelp()
    }
}
module.exports=create
async function create(options){
    var stack=options.stack
    log('building '+(options.stack || options.input),stack,!options.silent)
    var file=options.input || __dirname+'/../templates/'+stack
    var output=options.output || `${__dirname}/../build/templates/${stack}.json`
    
    return Promise.resolve(require(file))
    .then(x=> typeof x ==="object" ? JSON.stringify(x) : x)
    .tap(()=>log("writting to "+output,!options.silent))
    .then(temp=>fs.writeFileAsync(output,stringify(JSON.parse(temp))))
    .then(()=>check(null,{file:output}))
    .tap(()=>log(chalk.green(stack+" is valid"),!options.silent))
    .tap(()=>log('finished building '+stack,!options.silent))
    .catch(error=>log(chalk.red(stack+" failed:"+error),!options.silent))
}

function log(message,show){
    if(show){console.log(message)}
}




