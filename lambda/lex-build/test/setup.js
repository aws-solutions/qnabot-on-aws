#! /usr/bin/env node
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var chalk=require('chalk')
var Promise=require('bluebird')
var config=require('../../../config')

var fs=Promise.promisifyAll(require('fs'))
var aws=require('aws-sdk')
var outputs=require('../../../bin/exports')
aws.config.setPromisesDependency(Promise)
aws.config.region=config.region
var s3=new aws.S3()

module.exports=Promise.method(async function(event){
    process.env.AWS_ACCESS_KEY_ID=aws.config.credentials.accessKeyId
    process.env.AWS_SECRET_ACCESS_KEY=aws.config.credentials.secretAccessKey
    process.env.AWS_REGION=config.region
    
    process.env.SALT='salt'
    var envs=await outputs('dev/bucket',{wait:true})
    process.env.UTTERANCE_BUCKET=envs.Bucket
    process.env.STATUS_BUCKET=envs.Bucket
    process.env.STATUS_KEY="status.json"
    process.env.UTTERANCE_KEY="utterances.json"

    await s3.putObject({
        Bucket:process.env.UTTERANCE_BUCKET,
        Key:process.env.UTTERANCE_KEY,
        Body:JSON.stringify(["a","b"])
    }).promise()
    await s3.putObject({
        Bucket:process.env.STATUS_BUCKET,
        Key:"status.json",
        Body:JSON.stringify({})
    }).promise()

    await Promise.promisify(require('../index.js').handler)(event,{})
    return true
})


