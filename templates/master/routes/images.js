var fs=require('fs')
var resource=require('./util/resource')
var _=require('lodash')
const util = require('../../util');

module.exports={
    "Images": resource('images'),
    "ImagesProxy": resource('{proxy+}',{"Ref":"Images"}),
    "ImagesProxyGet":proxy({
        auth: "NONE",
        resource:{"Ref": "ImagesProxy"},
        method:"get",
        path:"/assets/{proxy}",
        requestParams:{
            "integration.request.path.proxy":"method.request.path.proxy"
        },
        responseParameters:{
            "method.response.header.api-stage":"context.stage"
        }
    })
}

function proxy(opts){
    return {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "AuthorizationType": opts.auth || "AWS_IAM",
        "HttpMethod":opts.method.toUpperCase(),
        "Integration": {
          "Type": "AWS",
          "IntegrationHttpMethod":opts.method.toUpperCase(),
          "Credentials":{"Fn::GetAtt":["S3AccessRole","Arn"]},
          "Uri": {"Fn::Join": ["",[
                "arn:aws:apigateway:",
                {"Ref": "AWS::Region"},
                ":s3:path/",{"Ref":"Bucket"},
                opts.path
          ]]},
          "RequestParameters":opts.requestParams || {},
          "IntegrationResponses": [
            {
                "StatusCode":200,
                "ContentHandling":"CONVERT_TO_BINARY",
                "ResponseParameters":Object.assign({
                    "method.response.header.content-type":"integration.response.header.Content-Type"
                },
                opts.responseParameters)
            },{
                "StatusCode":404,
                "ResponseTemplates":{
                    "application/xml":JSON.stringify({
                        error:"Not found"
                    })
                },
                "SelectionPattern":"403"
            }
          ]
        },
        "RequestParameters":{
            "method.request.path.proxy":false
        },
        "ResourceId":opts.resource,
        "MethodResponses": [
          {
            "StatusCode": 200,
            "ResponseParameters":Object.assign({
                "method.response.header.content-type":false
            },
            _.mapValues(opts.responseParameters || {},x=>false))
          },
          {"StatusCode": 400},
          {"StatusCode": 404}
        ],
        "RestApiId": {"Ref": "API"}
      },
      "Metadata": util.cfnNag(["W59"])
    }
}
