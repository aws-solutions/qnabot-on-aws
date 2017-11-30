var fs=require('fs')

module.exports={
    "Static": require('./util/resource')('static'),
    "Proxy": require('./util/resource')('{proxy+}',{"Ref":"Static"}),
    "ProxyAny":{
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "AuthorizationType": "NONE",
        "HttpMethod": "GET",
        "Integration": {
          "Type": "AWS",
          "IntegrationHttpMethod":"GET",
          "Credentials":{"Fn::GetAtt":["S3AccessRole","Arn"]},
          "Uri": {"Fn::Join": ["",[
                "arn:aws:apigateway:",
                {"Ref": "AWS::Region"},
                ":s3:path/",{"Ref":"Bucket"},
                "/{proxy}"
          ]]},
          "RequestParameters":{
            "integration.request.path.proxy":"method.request.path.proxy"
          },
          "IntegrationResponses": [
            {
                "StatusCode":200,
                "ResponseParameters":{
                    "method.response.header.content-type":"integration.response.header.Content-Type"
                }
            },
          ]
        },
        "RequestParameters":{
            "method.request.path.proxy":false
        },
        "ResourceId": {"Ref": "Proxy"},
        "MethodResponses": [
          {
            "StatusCode": 200,
            "ResponseParameters":{
                "method.response.header.content-type":false
            }
          },
          {"StatusCode": 400}
        ],
        "RestApiId": {"Ref": "API"}
      }
    }
}
    
