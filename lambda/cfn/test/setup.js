#! /usr/bin/env node
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var chalk=require('chalk')
var Promise=require('bluebird')
var config=require('../../../config')

var outputs=require('../../../bin/exports')
var fs=Promise.promisifyAll(require('fs'))
var aws=require('aws-sdk')
aws.config.setPromisesDependency(Promise)
aws.config.region=config.region

module.exports=function(event){
    process.env.AWS_ACCESS_KEY_ID=aws.config.credentials.accessKeyId
    process.env.AWS_SECRET_ACCESS_KEY=aws.config.credentials.secretAccessKey
    process.env.AWS_REGION=config.region

    
    return Promise.join(
        event,
        outputs('dev/lambda') 
    ).spread(function(ev,output){
        return new Promise(function(res,rej){
            require('../index.js').handler(ev,{
                invokedFunctionArn:output.lambda,
                done:res
            })
        })
    })
}


