var fs=require('fs')

module.exports={
    "Static": require('./util/resource')('static'),
    "Proxy": require('./util/resource')('{proxy+}',{"Ref":"Static"}),
    "ProxyAny":{
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "AuthorizationType": "NONE",
        "HttpMethod": "ANY",
        "Integration": {
          "IntegrationHttpMethod":"ANY",
          "Type": "HTTP_PROXY",
          "Uri":{"Fn::Join":["",[
            "http://",{"Ref":"Bucket"},".s3.amazonaws.com/{proxy}"
          ]]},
          "RequestParameters":{
            "integration.request.path.proxy":"method.request.path.proxy"
          }
        },
        "RequestParameters":{
            "method.request.path.proxy":false
        },
        "ResourceId": {"Ref": "Proxy"},
        "MethodResponses": [
          {"StatusCode": 200},
          {"StatusCode": 400}
        ],
        "RestApiId": {"Ref": "API"}
      }
    }
}
    
