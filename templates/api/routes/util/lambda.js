var clean=require('clean-deep')
var fs=require('fs')
var templates=__dirname+'/../templates'
var _=require('lodash')

module.exports=function(params){
    return clean({
    "Type": "AWS::ApiGateway::Method",
    "Properties": {
        "AuthorizationType":params.authorization || "NONE",
        "AuthorizerId":params.authorizerId,
        "HttpMethod": params.method.toUpperCase(),
        "Integration": {
          "Type": "AWS",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Join": ["",[
                "arn:aws:apigateway:",
                {"Ref": "AWS::Region"},
                ":lambda:path/2015-03-31/functions/",
                params.lambda || {"Ref":"HandlerArn"},
                "/invocations"
            ]]
          },
          "IntegrationResponses": _.concat({   
                "StatusCode": params.defaultResponse || 200,
                "ResponseParameters":params.responseParameters,
                "ResponseTemplates":{
                    "application/json":params.responseTemplate
                }
            },params.errors || {   
                "SelectionPattern":params.errorMessage || "Error:.*",
                "StatusCode": params.errorCode || 500,
                "ResponseTemplates":{
                    "application/json":fs.readFileSync(__dirname+"/../error/error.vm",'utf8')
                }
          })
          ,
          "RequestParameters":params.parameterNames,
          "RequestTemplates": {
            "application/json":params.template 
          }
        },
        "RequestModels":params.models,
        "RequestParameters":params.parameterLocations,
        "ResourceId": params.resource,
        "MethodResponses": [
          {
            "StatusCode": params.defaultResponse || 200,
            "ResponseParameters":Object.assign({
                "method.response.header.date":true
            },_.mapValues(params.responseParameters,x=>false))
          },
          {
            "StatusCode": 404
          },
          {
            "StatusCode": 500
          }
        ],
        "RestApiId":{"Ref":"API"}
      }
    },{
        emptyStrings:false 
    })
}
function errorResponse(code){
    return {
        "StatusCode": code,
        "SelectionPattern":'"httpCode":"'+code+'"',
        "ResponseTemplates":{
            "application/json":fs.readFileSync(
                templates+'/response.fail.vm',"utf8"
            )
        }
    }  
}
