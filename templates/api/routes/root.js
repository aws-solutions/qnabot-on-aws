var fs=require('fs')

module.exports={
    "rootGet":{
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "AuthorizationType": "NONE",
        "HttpMethod": "GET",
        "Integration": {
          "Type": "MOCK",
          "IntegrationResponses": [{
            "ResponseTemplates":{
                "application/json":fs.readFileSync(
                    __dirname+"/templates/info.vm",
                    "utf8"
                )
            },
            "StatusCode":"200"
          }],
          "RequestTemplates": {
            "application/json":"{\"statusCode\": 200}"
          }
        },
        "ResourceId": {"Fn::GetAtt": ["API","RootResourceId"]},
        "MethodResponses": [{"StatusCode": 200}],
        "RestApiId":{"Ref":"API"} 
      }
    }
}
    
