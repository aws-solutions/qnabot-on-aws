var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION
var s3=new aws.S3()
const lexv2 = new aws.LexModelsV2();

exports.handler = async (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    let bucket=process.env.STATUS_BUCKET;
    let lexV1StatusFile=process.env.STATUS_KEY;
    let lexV2StatusFile=process.env.LEXV2_STATUS_KEY;
    let build = {"status":"READY","token":"token"};
    let response;

    try {
        response = await s3.getObject({Bucket:bucket, Key:lexV2StatusFile}).promise();
        build = JSON.parse(response.Body.toString());
        // combine build status with v1 bot, if defined.. If both are READY then status is READY
        if (lexV1StatusFile) {
            response = await s3.getObject({Bucket:bucket, Key:lexV1StatusFile}).promise();
            let v1build = JSON.parse(response.Body.toString());
            if (v1build.status != "READY" || build.status != "READY" ) {
                build.status = "LEX V2: " + build.status + " / LEX V1: " + v1build.status
            }
        }
    } catch(e) {
        console.log("Unable to read S3 lex bot status file - perhaps it doesn't yet exist. Returning READY");
    }

    response = await lexv2.describeBot({
            botId:process.env.LEXV2_BOT_ID,
        }).promise() ;
    // Match LexV1 bot status for code compatibility (Available = READY)
    let botStatus = (response.botStatus == "Available") ? "READY" :  response.botStatus ;
    
    return {
        "lambdaArn": process.env.FULFILLMENT_FUNCTION_ARN,
        "lambdaRole":process.env.FULFILLMENT_FUNCTION_ROLE,
        "botversion":"live",
        "botname":process.env.LEXV1_BOT_NAME || "LEX V1 Bot not installed",
        "intent":process.env.LEXV1_INTENT || "LEX V1 Bot not installed",
        "intentFallback":process.env.LEXV1_INTENT_FALLBACK || "LEX V1 Bot not installed",
        "lexV2botname":process.env.LEXV2_BOT_NAME || "LEX V2 Bot not installed",
        "lexV2botid":process.env.LEXV2_BOT_ID || "LEX V2 Bot not installed",
        "lexV2botalias":process.env.LEXV2_BOT_ALIAS || "LEX V2 Bot not installed",
        "lexV2botaliasid":process.env.LEXV2_BOT_ALIAS_ID || "LEX V2 Bot not installed",
        "lexV2intent":process.env.LEXV2_INTENT || "LEX V2 Bot not installed",
        "lexV2intentFallback":process.env.LEXV2_INTENT_FALLBACK || "LEX V2 Bot not installed",
        "lexV2localeids":process.env.LEXV2_BOT_LOCALE_IDS || "LEX V2 Bot not installed",
        "status":botStatus,
        "build":build,
    } ;
};


