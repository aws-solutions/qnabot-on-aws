var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION
var lambda=new aws.Lambda()
var lex=new aws.LexModelBuildingService
var s3=new aws.S3()
var crypto=require('crypto')

exports.handler=function(event,context,callback){
    return s3.getObject({
        Bucket:process.env.STATUS_BUCKET,
        Key:process.env.STATUS_KEY
    }).promise()
    .then(x=>JSON.parse(x.Body.toString()))
    .then(status=>{
        return lex.getBot({
            name:process.env.BOT_NAME,
            versionOrAlias:"$LATEST"
        }).promise()
        .then(result=>{
            status.status=result.status
            if(result.status==="BUILDING"){
                return new Promise(function(res,rej){
                    setTimeout(()=>{
                        lambda.invoke({
                           FunctionName:process.env.AWS_LAMBDA_FUNCTION_NAME,
                           InvocationType:"Event",
                           Payload:JSON.stringify(event)
                        }).promise()
                        .then(res).catch(rej)
                    },2*1000    
                    )
                })
            }else{
                return s3.putObject({
                    Bucket:process.env.STATUS_BUCKET,
                    Key:process.env.STATUS_KEY,
                    Body:JSON.stringify(status)
                }).promise()
            }
        })
    })
    .then(()=>callback(null))
    .catch(callback)
}
