var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION
var s3=new aws.S3()

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
   
    return s3.listObjects({
        Bucket:event.bucket,
        Prefix:event.prefix,
        MaxKeys:event.perpage || 100,
        Marker:event.token || null
    }).promise()
    .then(x=>{
        console.log("s3 response:",JSON.stringify(x,null,2))
        callback(null,{
            token:x.NextMarker,
            jobs:x.Contents.map(y=>{return {
                id:y.Key.split('/').pop(),
                href:event.root+"/jobs/imports/"+encodeURI(y.Key.split('/').pop())
            }})
        })
    })
    .catch(e=>callback(JSON.stringify({
        type:"[InternalServiceError]",
        data:e
    })))
}


