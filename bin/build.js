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
var fs = require('fs');
var envs=require('./exports')()
var name=process.argv[2]
var mainfile=__dirname+'/../templates/'+name
var testfile=__dirname+'/../templates/'+name+'/test.js'
var mainoutput=__dirname+'/../build/templates/'+name
var testoutput=__dirname+'/../build/templates/test/'+name

Promise.resolve(require(mainfile))
.then(function(result){
    var template=JSON.stringify(result)
    create(template,name,mainoutput)
})

if (fs.existsSync(testfile)) {
    Promise.resolve(require(testfile))
    .then(function(result){
        var testtemplate=JSON.stringify(result)
        create(testtemplate,name+'-test',testoutput)
    })
}

function create(temp,name,output){
    console.log('building '+name)
    if(temp.length < 51200 ){
        var val=cf.validateTemplate({
            TemplateBody:temp
        }).promise()
    }else{
        var val=envs
        .tap(env=>{
            if(!env["QNA-DEV-BUCKET"]){
                console.log("Launch dev/bucket to have scratch space for large template")
            }else{
                return s3.putObject({
                    Bucket:env["QNA-DEV-BUCKET"],
                    Key:"scratch/"+name+".json",
                    Body:temp
                }).promise()
                .tap(()=>console.log(chalk.green(`uploaded to s3:${env["QNA-DEV-BUCKET"]}/scratch/${name}.json`)))
                .then(()=>cf.validateTemplate({
                TemplateURL:`http://s3.amazonaws.com/${env["QNA-DEV-BUCKET"]}/scratch/${name}.json`
                }).promise())
            }
        })
    }

    return val
    .tap(()=>console.log(chalk.green(name+" is valid")))
    .catch(error=>console.log(chalk.red(name+" failed:"+error)))
    .tap(()=>console.log("writting to "+output+'.json'))
    .tap(()=>console.log("writting to "+output+'.min.json'))
    .then(()=>Promise.join( 
        fs.writeFileAsync(output+'.json',stringify(JSON.parse(temp))),
        fs.writeFileAsync(output+'.min.json',temp)
    ))
    .tap(()=>console.log('finished building '+name))
}






