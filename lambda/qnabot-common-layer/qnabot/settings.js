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

module.exports ={
    
    get_settings: async function() {
        const default_jwks_param = process.env.DEFAULT_USER_POOL_JWKS_PARAM;
        const default_settings_param = process.env.DEFAULT_SETTINGS_PARAM;
        const custom_settings_param = process.env.CUSTOM_SETTINGS_PARAM;
        const default_jwks_url 
    
        if(default_jwks_param){
            qnabot.log("Getting Default JWKS URL from SSM Parameter Store: ", default_jwks_param);
            const default_jwks_url = await get_parameter(default_jwks_param);
        }

        qnabot.log("Getting Default QnABot settings from SSM Parameter Store: ", default_settings_param);
        const default_settings = await get_parameter(default_settings_param);
        qnabot.log(`Default Settings: ${JSON.stringify(default_settings,null,2)}`);
    
        qnabot.log("Getting Custom QnABot settings from SSM Parameter Store: ", custom_settings_param);
        const custom_settings = await get_parameter(custom_settings_param);
        qnabot.log(`Custom Settings: ${JSON.stringify(custom_settings,null,2)}`);
    
        const settings = _.merge(default_settings, custom_settings);
        _.set(settings, "DEFAULT_USER_POOL_JWKS_URL", default_jwks_url);
        qnabot.log(`Merged Settings: ${JSON.stringify(settings,null,2)}`);
    
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
        return settings;
    }
}