var fs=require('fs')

module.exports=function(opts){
    return {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "AuthorizationType": opts.auth || "AWS_IAM",
        "HttpMethod": opts.method,
        "Integration": {
          "Type": "MOCK",
          "IntegrationResponses": [{
            "ResponseTemplates":{
                "application/json":fs.readFileSync(
                    __dirname+"/../"+opts.template+".vm",
                    "utf8"
                )
            },
            "StatusCode":"200"
          }],
          "RequestTemplates": {
            "application/json":"{\"statusCode\": 200}"
          }
        },
        "ResourceId":opts.resource,
        "MethodResponses": [{"StatusCode": 200}],
        "RestApiId":{"Ref":"API"} 
      }
    }
}
