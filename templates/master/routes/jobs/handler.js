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
        .then(x => {
            if (x.Contents && Array.isArray(x.Contents)) {
                x.Contents.sort((a, b) => {
                    if (a.LastModified && b.LastModified) {
                        return new Date(b.LastModified).getTime() - new Date(a.LastModified).getTime();
                    } else {
                        return 0;
                    }
                })
            }
            callback(null, {
            token:x.NextMarker,
            jobs:x.Contents.map(y=>{return {
                id:y.Key.split('/').pop(),
                href:`${event.root}/jobs/${event.type}/`+encodeURI(y.Key.split('/').pop())
            }})
        })
    })
    .catch(e=>callback(JSON.stringify({
        type:"[InternalServiceError]",
        data:e
    })))
}


