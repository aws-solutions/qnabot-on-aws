var response = require('cfn-response')
var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION
var s3=new aws.S3()

exports.handler = function(event, context) {
    console.log(JSON.stringify(event,null,2))
    if(event.RequestType!=="Delete"){
        s3.headObject({
            Bucket:event.ResourceProperties.Bucket,
            Key:event.ResourceProperties.Key
        }).promise()
        .then(result=>response.send(event, context, response.SUCCESS,{
            version:result.VersionId ? result.VersionId : 1
        }))
        .catch(x=>{
            console.log(x)
            response.send(event, context, response.FAILED)
        })
    }else{
        response.send(event, context, response.SUCCESS)
    }
}


