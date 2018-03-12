var response = require('cfn-response')
var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION
var cb=new aws.CodeBuild()
var s3=new aws.S3()
var ecr=new aws.ECR()
var lambda=new aws.Lambda()

exports.clearImage = function(event, context) {
    console.log(JSON.stringify(event,null,2))

    if(event.RequestType==="Delete"){
        ecr.batchDeleteImage({
            imageIds:[{imageTag:event.ResourceProperties.tag}],
            repositoryName:event.ResourceProperties.repo
        }).promise()
        .then(()=>response.send(event, context, response.SUCCESS))
        .catch(x=>{
            console.log(x)
            response.send(event, context, response.SUCCESS)
        })
    }else{
        response.send(event, context, response.SUCCESS)
    }
}

