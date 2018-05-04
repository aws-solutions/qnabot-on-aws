var aws=require('aws-sdk')
aws.config='us-east-1'
var s3=new aws.S3()

run()

async function run(){
    var result=await s3.getObject({
        Bucket:"qna-dev-dev-master-40-exportbucket-fgiztk0ghtl5",
        Key:"data/qna.jsond"
    }).promise()
    var raw=result.Body.toString()
    console.log(`[${raw.replace(/$/g,',')}]`)
}
