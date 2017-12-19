var resource=require('../util/resource')
var lambda=require('../util/lambda')
var mock=require('../util/mock')
var fs=require('fs')
var _=require('lodash')
module.exports={
"Bot": resource('bot'),
"UtterancesApi": resource('utterances',{"Ref":"Bot"}),
"AlexaApi": resource('alexa',{"Ref":"Bot"}),
"Hooks": resource('hooks',{"Ref":"Bot"}),
"HooksGet":config({
    method:"GET",
    response:fs.readFileSync(__dirname+'/config.get.vm','utf8')
}),
"HooksPut":config({
    method:"PUT",
    response:fs.readFileSync(__dirname+'/config.get.vm','utf8'),
    request:fs.readFileSync(__dirname+'/config.put.vm','utf8')
}),
"HooksOptions":mock({
    method:"OPTIONS",
    template:"bot/config.options",
    resource:{"Ref":"Hooks"}
}),
"AlexaSchema":mock({
    method:"GET",
    template:"bot/alexa",
    resource:{"Ref":"AlexaApi"}
}),
"BotPost":lambda({
    authorization:"AWS_IAM",
    method:"post",
    template:fs.readFileSync(__dirname+'/post.vm','utf8'),
    lambda:{"Fn::GetAtt":["LexBuildLambda","Arn"]},
    resource:{"Ref":"Bot"},
    parameterNames:{"integration.request.header.X-Amz-Invocation-Type":"'Event'"},
    responseTemplate:fs.readFileSync(__dirname+'/post.resp.vm','utf8')
}),
"BotGet":lambda({
    authorization:"AWS_IAM",
    method:"get",
    template:fs.readFileSync(__dirname+'/get.vm','utf8'),
    lambda:{"Fn::GetAtt":["LexProxyLambda","Arn"]},
    resource:{"Ref":"Bot"},
    responseTemplate:fs.readFileSync(__dirname+'/get.resp.vm','utf8')
}),
"UtterancesGet":lambda({
    authorization:"AWS_IAM",
    method:"get",
    lambda:{"Fn::GetAtt":["LexProxyLambda","Arn"]},
    template:fs.readFileSync(__dirname+'/utterance.get.vm','utf8'),
    responseTemplate:fs.readFileSync(__dirname+'/utterance.get.resp.vm','utf8'),
    resource:{"Ref":"UtterancesApi"}
}),
"BotDoc":{
    "Type" : "AWS::ApiGateway::DocumentationPart",
    "Properties" : {
        "Location" : {
            "Type":"RESOURCE",
            "Path":"/bot"
        },
        "Properties" :JSON.stringify({
           description:""  
        }),
        "RestApiId" : {"Ref":"API"}
    }
}
}
function config(opts){
    return {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "AuthorizationType": "AWS_IAM",
        "HttpMethod":opts.method,
        "Integration":_.pickBy({
            "Type": "AWS",
            "IntegrationHttpMethod":opts.method,
            "Credentials":{"Fn::GetAtt":["LambdaAccessRole","Arn"]},
            "Uri": {"Fn::Join": ["",[
                "arn:aws:apigateway:",
                {"Ref": "AWS::Region"},
                ":lambda:path/2015-03-31/functions/",
                {"Ref":"HandlerArn"},
                "/configuration"
            ]]},
            "IntegrationResponses": [{
                "StatusCode":200,
                "ResponseTemplates":{
                    "application/json":opts.response
                }
            }],
            "RequestTemplates":opts.request ? {
                "application/json":opts.request
            } : null
        }),
        "ResourceId":{"Ref":"Hooks"},
        "MethodResponses": [
          {"StatusCode": 200},
          {"StatusCode": 400}
        ],
        "RestApiId": {"Ref": "API"}
      }
    }
} 
