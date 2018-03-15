var aws=require('./aws')
var s3=new aws.S3()

module.exports=function(status,message){
    return s3.getObject({
        Bucket:process.env.STATUS_BUCKET,
        Key:process.env.STATUS_KEY,
    }).promise()
    .then(x=>JSON.parse(x.Body.toString()))
    .then(result=>{
        if(message) result.message=message
        result.status=status
        console.log(result)
        return s3.putObject({
            Bucket:process.env.STATUS_BUCKET,
            Key:"status.json",
            Body:JSON.stringify(result)
        }).promise()
    })
}
