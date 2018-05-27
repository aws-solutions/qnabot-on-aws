var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION
var lex=new aws.LexModelBuildingService()
var s3=new aws.S3()
exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    s3.getObject({
        Bucket:process.env.STATUS_BUCKET,
        Key:process.env.STATUS_KEY
    }).promise()
    .then(x=>JSON.parse(x.Body.toString()))
    .catch(x=>{
        console.log(x)
        return {}
    })
    .then(result=>{
        return lex.getBotVersions({
            name:process.env.BOT_NAME,
        }).promise()
        .then(versions=>{
            console.log(versions)
            var version=versions.bots
                .filter(version=>version.status==="READY")
                .map(x=>x.version)
                .sort()
                .reverse()[0]
            console.log(version)
            return version
        })
        .then(version=>lex.getBot({
            name:process.env.BOT_NAME,
            versionOrAlias:version
        }).promise())
        .then(bot=>{
            bot.build=result
            return bot
        })
    })
    .then(function(x){
        console.log("Response: "+JSON.stringify(x,null,2))
        callback(null,x)
    })
    .catch(function(y){
        console.log("Error: "+y)
        callback(JSON.stringify({
            type:"[InternalServiceError]",
            data:y
        }))
    })
};

