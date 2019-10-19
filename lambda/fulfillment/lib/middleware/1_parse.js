var Promise=require('bluebird')
var lex=require('./lex')
var alexa=require('./alexa')
var _=require('lodash')
var AWS=require('aws-sdk');


async function get_settings() {
    var settings_param = process.env.SETTINGS_PARAM;
    var ssm = new AWS.SSM();
    var params = {
        Name: settings_param,
    };
    console.log("Getting QnABot settings from SSM Parameter Store: ", settings_param);
    var response = await ssm.getParameter(params).promise();
    var settings = JSON.parse(response.Parameter.Value);
    console.log("Settings: ", settings);
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



