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

module.exports=Promise.method(run)

if (require.main === module) {
    var argv=require('commander')
    var ran
    var args=argv.version('1.0')
        .name('npm run check')
        .arguments('<stack>')
        .description("Check syntax of cloudformation templates")
        .usage("<stack> [options]")
        .option("--file <file>","absolute path to template file")
        .action(async function(stack,options){
            ran=true
            try{
                var result=await run(stack,options)
                console.log(`${stack} is Valid`)
            }catch(e){
                console.log("Invalid")
                console.log(e.message)
            }
        })
        .parse(process.argv)
    if(!ran){
        argv.outputHelp()
    }
}

async function run(stack,options={}){
    var name=stack || options.file.split('/')
        .reverse()
        .filter(x=>x)
        .slice(0,2)
        .reverse().join('-').split('.')[0]
    
    var template=await fs.readFileSync(options.file || `${__dirname}/../build/templates/${stack}.json`,'utf8')
    console.log('resources: '+Object.keys(JSON.parse(template).Resources).length)
    if(Buffer.byteLength(template)>51200){
        var exp=await bootstrap()
        var Bucket=exp.Bucket
        var prefix=exp.Prefix
        var Key=`${prefix}/templates/${stack}.json`
        var TemplateURL=`http://s3.amazonaws.com/${Bucket}/${Key}`
        console.log(TemplateURL)
        await s3.putObject({Bucket,Key,Body:template}).promise()
        return cf.validateTemplate({TemplateURL}).promise()
    }else{
        return cf.validateTemplate({
            TemplateBody:template
        }).promise()
    }
}

async function bootstrap(){
    var outputs={}
    var tmp=await cf.describeStacks({
        StackName:name("dev/bootstrap",{})
    }).promise()
    
    tmp.Stacks[0].Outputs.forEach(x=>outputs[x.OutputKey]=x.OutputValue)
    return outputs
}

