const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
const client = new S3Client({region: process.env.AWS_REGION})

exports.handler = function(event, context) {
    console.log(JSON.stringify(event,null,2))
    if(event.RequestType!=="Delete"){
        client.send(new HeadObjectCommand({
            Bucket:event.ResourceProperties.Bucket,
            Key:event.ResourceProperties.Key
        }))
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