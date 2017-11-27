var fs=require('fs')

module.exports={
    "Info": require('./util/resource')('info'),
    "infoGet":{
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
        "ResourceId": {"Ref": "Info"},
        "MethodResponses": [
          {"StatusCode": 200},
          {"StatusCode": 400}
        ],
        "RestApiId": {"Ref": "API"}
      }
    }
}
    
