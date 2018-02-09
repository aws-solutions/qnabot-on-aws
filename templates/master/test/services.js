var _=require('lodash')
var config=require('../../../config')
var Promise=require('bluebird')
var outputs=require('../../../bin/exports')
var api=require('./util').api
var aws=require('aws-sdk')
var outputs=require('../../../bin/exports')
aws.config.setPromisesDependency(Promise)
aws.config.region=config.region
var lambda=new aws.Lambda()

module.exports={
    setUp:async function(done){
        this.services=await api({
            path:'services',
            method:'GET'
        })
        done()
    },
    qid:async function(test){
        var result=await lambda.invoke({
            FunctionName:this.services.elasticsearch.qid,
            Payload:JSON.stringify({qid:'test.1'}),
            InvocationType:"RequestResponse"
        }).promise()
        test.equal(result.StatusCode,200)
        test.done()
    },
    proxy:async function(test){
        var output=await outputs('dev/master')
        var result=await lambda.invoke({
            FunctionName:this.services.elasticsearch.proxy,
            Payload:JSON.stringify({
                endpoint:output.ElasticsearchEndpoint,
                path:'/',
                method:"GET"
            }),
            InvocationType:"RequestResponse"
        }).promise()
        test.equal(result.StatusCode,200)
        test.done()
    }
}


