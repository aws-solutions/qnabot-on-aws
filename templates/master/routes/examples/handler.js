var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION
var s3=new aws.S3()

exports.photos = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    return s3.listObjects({
        Bucket:event.bucket,
        Prefix:event.prefix,
        MaxKeys:event.perpage || 100,
        Marker:event.token || null
    }).promise()
    .then(x=>{
        console.log("s3 response:",JSON.stringify(x,null,2))
        var photos=x.Contents.map(function(value){
            var key=value.Key.split('/').pop()
            return `${event.root}/examples/photos/${key}`
        },[])
        callback(null,{
            token:x.NextMarker,
            photos
        })
    })
    .catch(e=>callback(JSON.stringify({
        type:"[InternalServiceError]",
        data:e
    })))
}
exports.documents = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
   
    return s3.listObjects({
        Bucket:event.bucket,
        Prefix:event.prefix,
        MaxKeys:event.perpage || 100,
        Marker:event.token || null
    }).promise()
    .then(x=>{
        console.log("s3 response:",JSON.stringify(x,null,2))
        var examples=x.Contents.reduce(function(accum,value){
            var key=value.Key.split('/').pop().split('.')
            var ext=key.length >1 ? key.pop() : 'txt'
            key=key[0]
            var href=`${event.root}/examples/documents/${key}.${ext}`
            if(!accum[key]){
                accum[key]={id:key}
            }
            if(ext==='json'){
                accum[key].document={href}
            }else{
                accum[key].description={href}
            }
            return accum
        },[])
        
        callback(null,{
            token:x.NextMarker,
            examples:Object.keys(examples).map(x=>examples[x])
        })
    })
    .catch(e=>callback(JSON.stringify({
        type:"[InternalServiceError]",
        data:e
    })))
}


