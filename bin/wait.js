#! /usr/bin/env node
var Promise=require('bluebird')
process.env.AWS_PROFILE=require('../config').profile
process.env.AWS_DEFAULT_REGION=require('../config').profile
var aws=require('aws-sdk')
var chalk=require('chalk')
aws.config.setPromisesDependency(Promise)
aws.config.region=require('../config').region
var cf=new aws.CloudFormation()
var StackName=process.argv[2]
const ora = require('ora');


new Promise(function(res,rej){
    console.log("Waiting on stack:"+StackName)
    const spinner = ora({
        text:'Getting Stack Status',
        spinner:"bouncingBar"
    }).start();
    spinner.color = 'yellow';

    next()
    function next(){
        cf.describeStacks({StackName}).promise()
        .then(x=>x.Stacks[0].StackStatus)
        .then(status=>{
            spinner.text=status
            if([
                "UPDATE_COMPLETE",
                "CREATE_COMPLETE",
                "UPDATE_ROLLBACK_COMPLETE",
                "DELETE_COMPLETE"
            ].includes(status)){
                spinner.succeed(status) 
            }else if([
                "UPDATE_IN_PROGRESS",
                "UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS",
                "UPDATE_ROLLBACK_IN_PROGRESS",
                "ROLLBACK_IN_PROGRESS",
                "DELETE_IN_PROGRESS",
                "CREATE_IN_PROGRESS"
            ].includes(status)){
                setTimeout(()=>next(),5000)
            }else{
                spinner.fail(status)
            }
        })
        .catch(error=>{
            spinner.fail(error.message)
            rej(error)
        })
    }
})
