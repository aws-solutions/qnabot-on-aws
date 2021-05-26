const aws=require('./aws')
const s3=new aws.S3()

var bucket=process.env.STATUS_BUCKET;
var lexV1StatusFile=process.env.STATUS_KEY;
    
module.exports=function(status,message){
    return s3.getObject({
        Bucket:bucket,
        Key:lexV1StatusFile,
    }).promise()
    .then(x=>JSON.parse(x.Body.toString()))
    .then(result=>{
        if(message) result.message=message;
        result.status=status;
        console.log(result);
        return s3.putObject({
            Bucket:bucket,
            Key:lexV1StatusFile,
            Body:JSON.stringify(result)
        }).promise();
    });
};
