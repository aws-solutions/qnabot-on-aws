#! /usr/bin/env node
var config=require('../config')
var fs=require('fs')
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.profile
var aws=require('aws-sdk')
var Promise=require('bluebird')
aws.config.setPromisesDependency(Promise)
aws.config.region=require('../config').region
var cf=new aws.CloudFormation()
var s3=new aws.S3()
var name=require('./name')
var chalk=require('chalk')

module.exports=run

if (require.main === module) {
    var argv=require('commander')
    var ran
    var args=argv.version('1.0')
        .name('npm run check')
        .arguments('<stack>')
        .description("Check syntax of cloudformation templates")
        .usage("<stack> [options]")
        .option("--file <file>","absolute path to template file")
        .action(function(stack,options){
            ran=true
            run(stack,options)
            .then(x=>console.log(`${stack} is Valid`))
            .catch(x=>{
                console.log("Invalid")
                console.log(x.message)
            })
        })
        .parse(process.argv)
    if(!ran){
        argv.outputHelp()
    }
}

function run(stack,options={}){
    var name=stack || options.file.split('/')
        .reverse()
        .filter(x=>x)
        .slice(0,2)
        .reverse().join('-').split('.')[0]
    
    var template=fs.readFileSync(options.file || `${__dirname}/../build/templates/${stack}.json`,'utf8')
    if(Buffer.byteLength(template)>51200){
        return bootstrap().then(function(exp){
            var bucket=exp.Bucket
            var prefix=exp.Prefix
            var opts={
                TemplateURL:`http://s3.amazonaws.com/${bucket}/${prefix}/templates/${name}.json`
            }
        })
    }else{
        return cf.validateTemplate({
            TemplateBody:template
        }).promise()
    }
}

function bootstrap(){
    var outputs={}
    return cf.describeStacks({
        StackName:name("dev/bootstrap",{})
    }).promise()
    .then(x=>x.Stacks[0].Outputs)
    .map(x=>outputs[x.OutputKey]=x.OutputValue)
    .return(outputs)
}

