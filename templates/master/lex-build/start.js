var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION
var lambda=new aws.Lambda()
var s3=new aws.S3()
var crypto=require('crypto')

exports.handler=async function(event,context,callback){
    var token=crypto.randomBytes(16).toString('base64');
    var bucket=process.env.STATUS_BUCKET;
    var lexV1StatusFile=process.env.STATUS_KEY;
    var lexV2StatusFile=process.env.LEXV2_STATUS_KEY;
    var functionName=process.env.BUILD_FUNCTION;
    var body=JSON.stringify({status:"Starting",token:token});

    if (lexV1StatusFile) {
        console.log("Initializing ", bucket, lexV1StatusFile);
        await s3.putObject({
            Bucket:bucket,
            Key:lexV1StatusFile,
            Body:body
        }).promise();
    }

    console.log("Initializing ", bucket, lexV2StatusFile);
    await s3.putObject({
        Bucket:bucket,
        Key:lexV2StatusFile,
        Body:body
    }).promise();

    // The BUILD_FUNCTION takes care of rebuilding Lex V2 bot, and (unless QnABot is set to V2 only) Lex V1 bot
    console.log("Invoking ", functionName);
    await lambda.invoke({
       FunctionName:functionName,
       InvocationType:"Event",
       Payload:"{}"
    }).promise();
    
    callback(null,{token});
};


