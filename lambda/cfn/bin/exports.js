#! /usr/bin/env node

var Promise=require('bluebird')
var config=require('../../../config')
var aws=require('aws-sdk')
aws.config.setPromisesDependency(Promise)
aws.config.region=config.region
var cf=new aws.CloudFormation()

module.exports=new Promise(function(res,rej){
    var exports={}

    cf.listExports()
    .promise()
    .get('Exports').each(exp=>exports[exp.Name]=exp.Value)
    .then(()=>res(exports))
    .catch(rej)
})


