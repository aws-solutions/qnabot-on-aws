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
        .then(result=>send(event, context, SUCCESS,{
            version:result.VersionId ? result.VersionId : 1
        }))
        .catch(x=>{
            console.log(x)
            send(event, context, FAILED)
        })
    }else{
        send(event, context, SUCCESS)
    }
}


