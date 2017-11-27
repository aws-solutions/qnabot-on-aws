#! /usr/bin/env node
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var chalk=require('chalk')
var Promise=require('bluebird')
var run=require('./run.js')
var config=require('../../../config')

var fs=Promise.promisifyAll(require('fs'))
var aws=require('aws-sdk')
aws.config.setPromisesDependency(Promise)
aws.config.region=config.region
var Exports=require('./exports')

module.exports=function(event){
    return Exports.then(function(exports){
        process.env.AWS_ACCESS_KEY_ID=aws.config.credentials.accessKeyId
        process.env.AWS_SECRET_ACCESS_KEY=aws.config.credentials.secretAccessKey
        process.env.AWS_REGION=config.region

        process.env.SALT='salt'
    })
    .then(()=>run(require('../index.js').handler,event))
    .return(true)
}


