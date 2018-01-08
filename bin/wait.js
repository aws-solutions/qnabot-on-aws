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
var show= process.argv[3]==="show" ? true : false
const ora = require('ora');

new Promise(function(res,rej){
    console.log("Waiting on stack:"+StackName)
    const spinner = new Spinner(show)
    
    next()
    function next(){
        cf.describeStacks({StackName}).promise()
        .then(x=>x.Stacks[0].StackStatus)
        .then(status=>{
            spinner.update(status)
            if([
                "UPDATE_COMPLETE",
                "CREATE_COMPLETE",
                "UPDATE_ROLLBACK_COMPLETE",
                "DELETE_COMPLETE"
            ].includes(status)){
                spinner.succeed(StackName+":"+status) 
            }else if([
                "UPDATE_IN_PROGRESS",
                "UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS",
                "UPDATE_COMPLETE_CLEANUP_IN_PROGRESS",
                "UPDATE_ROLLBACK_IN_PROGRESS",
                "ROLLBACK_IN_PROGRESS",
                "DELETE_IN_PROGRESS",
                "CREATE_IN_PROGRESS"
            ].includes(status)){
                setTimeout(()=>next(),5000)
            }else{
                spinner.fail(StackName+":"+status)
            }
        })
        .catch(error=>{
            spinner.fail(StackName+":"+error.message)
        })
    }
})

function Spinner(show){
    if(show){
        var self=this
        this.spinner = ora({
            text:'Getting Stack Status',
            spinner:"bouncingBar"
        }).start();
        this.spinner.color = 'yellow';
        this.update=function(txt){
            this.spinner.text=txt
        }
        this.succeed=this.spinner.succeed.bind(this.spinner)
        this.fail=this.spinner.fail.bind(this.spinner)

    }else{
        this.update=()=>{}
        this.succeed=console.log
        this.fail=console.log
    }
}
