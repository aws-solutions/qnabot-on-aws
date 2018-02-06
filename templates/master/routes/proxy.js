var fs=require('fs')
var resource=require('./util/resource')
var _=require('lodash')

module.exports={
    "Static": resource('static'),
    "Proxy": resource('{proxy+}',{"Ref":"Static"}),
    "ProxyAnyGet":proxy({
        resource:{"Ref": "Proxy"},
        method:"get",
        path:"/{proxy}",
        requestParams:{
            "integration.request.path.proxy":"method.request.path.proxy"
        },
        responseParameters:{
            "method.response.header.api-stage":"context.stage"
        }
    }),
    "ProxyAnyHead":proxy({
        resource:{"Ref": "Proxy"},
        method:"head",
        path:"/{proxy}",
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
        "AuthorizationType": "NONE",
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
      }
    }
}
