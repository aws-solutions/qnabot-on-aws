module.exports=function(resource){
    return {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "AuthorizationType": "NONE",
        "HttpMethod": "OPTIONS",
        "Integration": {
          "Type": "MOCK",
          "IntegrationResponses": [{
            "ResponseParameters":{
                "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                "method.response.header.Access-Control-Allow-Methods":"'GET,POST,PUT,OPTIONS'",
                "method.response.header.Access-Control-Allow-Origin": "'*'"
            },
            "ResponseTemplates":{
                "application/json":""
            },
            "StatusCode":"200"
          }],
          "RequestTemplates": {"application/json":"{\"statusCode\": 200}"}
        },
        "ResourceId":resource,
        "MethodResponses": [
          {
            "StatusCode": 200,
            "ResponseParameters":{
                "method.response.header.Access-Control-Allow-Headers":true,
                "method.response.header.Access-Control-Allow-Methods":true,
                "method.response.header.Access-Control-Allow-Origin": true

            }
          },
          {
            "StatusCode": 400
          }
        ],
        "RestApiId": {"Ref": "API"}
      }
    }
}
