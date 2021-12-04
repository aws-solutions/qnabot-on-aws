const _ = require("lodash")
const qnabot = require('./logging')

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function str2bool(settings) {
    var new_settings = _.mapValues(settings, x => {
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
    var ssm = new AWS.SSM();
    var params = {
        Name: param_name,
        WithDecryption: true
    };
    var response = await ssm.getParameter(params).promise();
    var settings = response.Parameter.Value
    if (isJson(settings)) {
        settings = JSON.parse(response.Parameter.Value);
        settings = str2bool(settings) ;
    }
    return settings;
}



function set_environment_variables(settings){
    if (settings.ENABLE_REDACTING) {
        qnabot.log("redacting enabled");
        process.env.QNAREDACT="true";
        process.env.REDACTING_REGEX=settings.REDACTING_REGEX;
    } else {
        qnabot.log("redacting disabled");
        process.env.QNAREDACT="false";
        process.env.REDACTING_REGEX="";
    }
    if (settings.DISABLE_CLOUDWATCH_LOGGING) {
        qnabot.log("disable cloudwatch logging");
        process.env.DISABLECLOUDWATCHLOGGING="true";
    } else {
        qnabot.log("enable cloudwatch logging");
        process.env.DISABLECLOUDWATCHLOGGING="false";
    }
    if(settings.ENABLE_REDACTING_WITH_COMPREHEND){
        qnabot.log("enable Amazon Comprehend based redaction.")
        process.env.ENABLE_REDACTING_WITH_COMPREHEND = "true"
    } else {
        qnabot.log("disable Amazon Comprehend based redaction.")
        process.env.ENABLE_REDACTING_WITH_COMPREHEND = "false"
    }
    if(settings.ENABLE_DEBUG_RESPONSE){
        process.env.ENABLE_DEBUG_RESPONSE = "true"
    }
}

module.exports ={
    set_environment_variables:set_environment_variables 
}