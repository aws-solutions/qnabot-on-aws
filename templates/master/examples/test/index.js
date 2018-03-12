var config=require('../../../../config')
process.env.STRIDE="10000"
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.region
process.env.AWS_REGION=config.region

var outputs=require('../../../../bin/exports')
var Promise=require('bluebird')
var aws=require("aws-sdk")
aws.config.region=config.region
var fs=require('fs')
var handler=Promise.promisifyAll(require('../index'),{multiArgs:true})
var cfn=Promise.promisifyAll(require('../cfn'),{multiArgs:true})

module.exports={
    test:async function(test){
        var output=await outputs('dev/bucket')
        try {
            await cfn.handlerAsync({
                "StackId": "stackid",
                "ResponseURL": "",
                "ResourceProperties":{
                    Bucket:output.Bucket 
                },
                "RequestType":"Create",
                "ResourceType": "Custom::QnABotExamples",
                "RequestId": "unique id for this create request",
                "LogicalResourceId": "MyTestResource"
            },null)
        }catch(e){
            console.log(e)
            test.ifError(e)
        }finally{
            test.done()
        }
    }
}
