var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION
var lambda=new aws.Lambda()
var lex=new aws.LexModelBuildingService
var s3=new aws.S3()
var crypto=require('crypto')

exports.handler=function(event,context,callback){
    var token=crypto.randomBytes(16).toString('base64')
    return s3.putObject({
        Bucket:process.env.STATUS_BUCKET,
        Key:process.env.STATUS_KEY,
        Body:JSON.stringify({
            status:"Starting",
            token:token
        })
    }).promise()
    .then(function(){
        return lambda.invoke({
           FunctionName:process.env.BUILD_FUNCTION,
           InvocationType:"Event",
           Payload:"{}"
        }).promise()
    })
    .then(()=>callback(null,{token}))
    .catch(callback)
}


