const Promise = require('bluebird')
const lex = require('./lex')
const multilanguage = require('./multilanguage')
const get_sentiment=require('./sentiment');
const alexa = require('./alexa')
const _ = require('lodash')
const AWS = require('aws-sdk');

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function str2bool(settings) {
    const new_settings = _.mapValues(settings, x => {
        if (_.isString(x)) {
            x = x.replace(/^"(.+)"$/,'$1');  // remove wrapping quotes
            if (x.toLowerCase() === "true") {
                return true ;
            }
            if (x.toLowerCase() === "false") {
                return false ;
            }
        }
        return x;
    });
    return new_settings;
}


async function get_parameter(param_name) {
    const ssm = new AWS.SSM();
    const params = {
        Name: param_name,
        WithDecryption: true
    };
    const response = await ssm.getParameter(params).promise();
    let settings = response.Parameter.Value ;
    if (isJson(settings)) {
        settings = JSON.parse(response.Parameter.Value);
        settings = str2bool(settings) ;
    }
    return settings;
}

async function get_settings() {
    const default_jwks_param = process.env.DEFAULT_USER_POOL_JWKS_PARAM;
    const default_settings_param = process.env.DEFAULT_SETTINGS_PARAM;
    const custom_settings_param = process.env.CUSTOM_SETTINGS_PARAM;

    console.log("Getting Default JWKS URL from SSM Parameter Store: ", default_jwks_param);
    const default_jwks_url = await get_parameter(default_jwks_param);

    console.log("Getting Default QnABot settings from SSM Parameter Store: ", default_settings_param);
    const default_settings = await get_parameter(default_settings_param);
    console.log(`Default Settings: ${JSON.stringify(default_settings,null,2)}`);

    console.log("Getting Custom QnABot settings from SSM Parameter Store: ", custom_settings_param);
    const custom_settings = await get_parameter(custom_settings_param);
    console.log(`Custom Settings: ${JSON.stringify(custom_settings,null,2)}`);

    const settings = _.merge(default_settings, custom_settings);
    _.set(settings, "DEFAULT_USER_POOL_JWKS_URL", default_jwks_url);
    console.log(`Merged Settings: ${JSON.stringify(settings,null,2)}`);

    if (settings.ENABLE_REDACTING) {
        console.log("redacting enabled");
        process.env.QNAREDACT="true";
        process.env.REDACTING_REGEX=settings.REDACTING_REGEX;
    } else {
        console.log("redacting disabled");
        process.env.QNAREDACT="false";
        process.env.REDACTING_REGEX="";
    }
    if (settings.DISABLE_CLOUDWATCH_LOGGING) {
        console.log("disable cloudwatch logging");
        process.env.DISABLECLOUDWATCHLOGGING="true";
    } else {
        console.log("enable cloudwatch logging");
        process.env.DISABLECLOUDWATCHLOGGING="false";
    }
    return settings;
}

// makes best guess as to lex client type in use based on fields in req.. not perfect
function getClientType(req) {
    if (req._type == 'ALEXA') {
        return req._type ;
    }
    // Try to determine which Lex client is being used based on patterns in the req - best effort attempt.
    const voiceortext = (req._preferredResponseType == 'SSML') ? "Voice" : "Text" ;
    if (_.get(req,"_event.requestAttributes.x-amz-lex:channel-type") == "Slack") {
        return "LEX.Slack." + voiceortext ;
    } else if (_.get(req,"_event.requestAttributes.x-amz-lex:channel-type") == "Twilio-SMS") {
        return "LEX.TwilioSMS." + voiceortext ;
    } else if (_.get(req,"_event.requestAttributes.x-amz-lex:accept-content-types")) {
        return "LEX.AmazonConnect." + voiceortext ;
    }
    else if (/^.*-.*-\d:.*-.*-.*-.*$/.test(_.get(req,"_event.userId"))){
        // user id pattern to detect lex-web-uithrough use of cognito id as userId: e.g. us-east-1:a8e1f7b2-b20d-441c-9698-aff8b519d8d5
        // TODO: add another clientType indicator for lex-web-ui?
        return "LEX.LexWebUI." + voiceortext ;
    } else {
        // generic LEX client
        return "LEX." + voiceortext ;
    }
}


module.exports = async function parse(req, res) {

    // Add QnABot settings from Parameter Store
    const settings = await get_settings();
    _.set(req, "_settings", settings);

    req._type = req._event.version ? "ALEXA" : "LEX"

    switch (req._type) {
        case 'LEX':
            Object.assign(req, await lex.parse(req))
            _.set(req,"_preferredResponseType","PlainText") ;
            // Determine preferred response message type - PlainText, or SSML
            const outputDialogMode = _.get(req,"_event.outputDialogMode") || _.get(req,"_event.inputMode") ;
            if (outputDialogMode == "Voice" || outputDialogMode == "Speech") {
                _.set(req,"_preferredResponseType","SSML") ;
            } else if (outputDialogMode == "Text") {
                // Amazon Connect uses outputDialogMode "Text" yet indicates support for SSML using request header x-amz-lex:accept-content-types
                const contentTypes = _.get(req,"_event.requestAttributes.x-amz-lex:accept-content-types","") ;
                if (contentTypes.includes("SSML")) {
                    _.set(req,"_preferredResponseType","SSML") ;
                }
            } else {
                console.log("WARNING: Unrecognised value for outputDialogMode:", outputDialogMode);
            }
            break;
        case 'ALEXA':
            Object.assign(req, await alexa.parse(req))
            _.set(req,"_preferredResponseType","SSML") ;
            break;
    }
    

    req._clientType = getClientType(req) ;


    // multilanguage support 
    if (_.get(settings, 'ENABLE_MULTI_LANGUAGE_SUPPORT')) {
        await multilanguage.set_multilang_env(req);
    }
    // end of multilanguage support 
    
    // get sentiment
    if (_.get(settings, 'ENABLE_SENTIMENT_SUPPORT')) {
        let sentiment = await get_sentiment(req.question);
        req.sentiment = sentiment.Sentiment ;
        req.sentimentScore = sentiment.SentimentScore ;
    } else {
        req.sentiment = "NOT_ENABLED";
        req.sentimentScore = {} ;
    }  

    Object.assign(res, {
        type: "PlainText",
        message: "",
        session: _.mapValues(_.omit(_.cloneDeep(req.session), ["appContext"]),
            x => {
                try {
                    return JSON.parse(x)
                } catch (e) {
                    return x
                }
            }),
        card: {
            send: false,
            title: "",
            text: "",
            url: ""
        },
        intentname: req.intentname
    })
    // ensure res.session.qnabotcontext exists
    if ( ! _.get(res,"session.qnabotcontext")) {
        _.set(res,"session.qnabotcontext",{}) ;
    }
    return { req, res }
}
