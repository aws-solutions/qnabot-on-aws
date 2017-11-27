var fs=require('fs')

module.exports={
    "ClientResource": require('./util/resource')('client'),
    "clientGet":{
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "AuthorizationType": "NONE",
        "HttpMethod": "GET",
        "Integration": {
          "Type": "MOCK",
          "IntegrationResponses": [{
            "ResponseTemplates":{
                "application/json":fs.readFileSync(
                    __dirname+"/templates/client.vm",
                    "utf8"
                )
            },
            "StatusCode":"200"
          }],
          "RequestTemplates": {
            "application/json":"{\"statusCode\": 200}"
          }
        },
        "ResourceId": {"Ref": "ClientResource"},
        "MethodResponses": [
          {"StatusCode": 200},
          {"StatusCode": 400}
        ],
        "RestApiId": {"Ref": "API"}
      }
    }
}
    

