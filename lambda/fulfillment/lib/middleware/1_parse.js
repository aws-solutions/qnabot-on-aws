var Promise=require('bluebird')
var lex=require('./lex')
var alexa=require('./alexa')
var _=require('lodash')
var AWS=require('aws-sdk');

async function get_parameter(param_name) {
    var ssm = new AWS.SSM();
    var params = {
        Name: param_name,
    };
    var response = await ssm.getParameter(params).promise();
    var settings = JSON.parse(response.Parameter.Value); 
    return settings;
}

async function get_settings() {
    var default_settings_param = process.env.DEFAULT_SETTINGS_PARAM;
    var custom_settings_param = process.env.CUSTOM_SETTINGS_PARAM;

    console.log("Getting Default QnABot settings from SSM Parameter Store: ", default_settings_param);
    var default_settings = await get_parameter(default_settings_param);
    
    console.log("Getting Custom QnABot settings from SSM Parameter Store: ", custom_settings_param);
    var custom_settings = await get_parameter(custom_settings_param);

    var settings = _.merge(default_settings, custom_settings);
    console.log("Merged Settings: ", settings);
    return settings;    
}

module.exports= async function parse(req,res){

    // Add QnABot settings from Parameter Store
    var settings = await get_settings();
    _.set(req,"_settings", settings);    
    
    req._type=req._event.version ? "ALEXA" : "LEX"

    switch(req._type){
        case 'LEX':
            Object.assign(req,lex.parse(req))
            break;
        case 'ALEXA':
            Object.assign(req,alexa.parse(req))
            break;
    }
    
    Object.assign(res,{
        type:"PlainText",
        message:"",
        session:_.mapValues(_.omit(_.cloneDeep(req.session),["appContext"]),
            x=>{
                try {
                    return JSON.parse(x)
                } catch(e){
                    return x
                }
            }),
        card:{
            send:false,
            title:"",
            text:"",
            url:""
        }
    })
    return {req,res}
}



