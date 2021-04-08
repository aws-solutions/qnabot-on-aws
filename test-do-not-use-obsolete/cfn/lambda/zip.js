var response = require('cfn-response')
var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION
var cb=new aws.CodeBuild()
var s3=new aws.S3()
var ecr=new aws.ECR()
var lambda=new aws.Lambda()

exports.zip = function(event, context) {
    console.log(JSON.stringify(event,null,2))

    if(event.RequestType==="Create"){
        s3.putObject({
            Bucket:event.ResourceProperties.bucket,
            Key:event.ResourceProperties.key,
            Body:new Buffer(event.ResourceProperties.body,"base64")
        }).promise()
        .then(x=>response.send(event,context,response.SUCCESS))
        .catch(x=>{
            console.log(x)
            response.send(event, context, response.FAILED)
        })
    }else{
        response.send(event, context, response.SUCCESS)
    }
}

