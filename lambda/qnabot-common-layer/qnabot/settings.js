const _ = require("lodash")
const qnabot = require('./logging')
const AWS = require("aws-sdk")

function str2bool(settings) {
    let new_settings = _.mapValues(settings, x => {
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
    let params = {
        Name: param_name,
        WithDecryption: true
    };

    let response = await ssm.getParameter(params).promise()
    let settings = response.Parameter.Value
    try {
        settings = JSON.parse(response.Parameter.Value)
        settings = str2bool(settings)
        return settings
    }
    catch(e){
        return settings;
    }
}

async function merge_default_and_custom_settings() {
    const default_settings_param = process.env.DEFAULT_SETTINGS_PARAM;
    const custom_settings_param = process.env.CUSTOM_SETTINGS_PARAM;

    qnabot.log("Getting Default QnABot settings from SSM Parameter Store: ", default_settings_param);
    let default_settings = await get_parameter(default_settings_param);

    qnabot.log("Getting Custom QnABot settings from SSM Parameter Store: ", custom_settings_param);
    let custom_settings = await get_parameter(custom_settings_param);

    let settings = _.merge(default_settings, custom_settings);
    return settings;
}

function set_environment_variables(settings){
    process.env.comprehendResult = ""

    if (settings.ENABLE_REDACTING) {
        qnabot.debug("redacting enabled");
        process.env.QNAREDACT="true";
        process.env.REDACTING_REGEX=settings.REDACTING_REGEX;
    } else {
        qnabot.debug("redacting disabled");
        process.env.QNAREDACT="false";
        process.env.REDACTING_REGEX="";
    }
    if (settings.DISABLE_CLOUDWATCH_LOGGING) {
        qnabot.debug("disable cloudwatch logging");
        process.env.DISABLECLOUDWATCHLOGGING="true";
    } else {
        qnabot.debug("enable cloudwatch logging");
        process.env.DISABLECLOUDWATCHLOGGING="false";
    }
    if(settings.ENABLE_REDACTING_WITH_COMPREHEND){
        qnabot.debug("enable Amazon Comprehend based redaction.")
        process.env.ENABLE_REDACTING_WITH_COMPREHEND = "true"
    } else {
        qnabot.debug("disable Amazon Comprehend based redaction.")
        process.env.ENABLE_REDACTING_WITH_COMPREHEND = "false"
    }
    if(settings.ENABLE_DEBUG_LOGGING){
        process.env.ENABLE_DEBUG_LOGGING = "true"
    }
}

async function set_alias_environment_variables(){
    // set environment vars for all example lambda hook and responsebot aliases
    const alias_settings_param = process.env.ALIAS_SETTINGS_PARAM;
    let alias_settings = await get_parameter(alias_settings_param);
    qnabot.log("Setting Alias EnvVars from SSM Parameter Store: ", alias_settings_param, "values:", alias_settings);
    Object.entries(alias_settings).forEach(([key, value]) => {
        process.env[key] = value;
    });
}

module.exports ={
    get_parameter:get_parameter,
    merge_default_and_custom_settings:merge_default_and_custom_settings,
    set_environment_variables:set_environment_variables,
    set_alias_environment_variables:set_alias_environment_variables,
}