#! /bin/env node
var config=require('../../config')
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.region

var faker=require('faker').lorem
var range=require('range').range
var fs=require('fs')

var env=require('../../bin/exports')()
var aws=require("aws-sdk")
var s3=new aws.S3({
    region:config.region
})

var count=10000
var data=range(0,count).map(qna).join('\n')

module.exports=function(){
    return env.then(envs=>s3.putObject({
        Bucket:envs["QNA-DEV-BUCKET"],
        Key:"import/bulk-test",
        Body:data
    }).promise())
}

function qna(index){
    return JSON.stringify({
        qid:"bulk-test."+index,
        q:range(0,1).map(x=>faker.sentence()),
        a:faker.sentence()
    })
}
