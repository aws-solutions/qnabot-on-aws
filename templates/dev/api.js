module.exports={
   "Description": "This template creates dev ApiGateway",
    "Resources": {
        "API": {
          "Type": "AWS::ApiGateway::RestApi",
          "Properties": {
            "Name":"test"
          }
        },
        "get":{
          "Type": "AWS::ApiGateway::Method",
          "Properties": {
            "HttpMethod":"GET",
            "AuthorizationType":"NONE",
            "Integration": {
              "Type": "MOCK",
              "IntegrationResponses": [{
                "ResponseTemplates":{
                    "application/json":"{}"
                },
                "StatusCode":"200"
              }],
              "RequestTemplates": {
                "application/json":"{\"statusCode\": 200}"
              }
            },
            "ResourceId":{"Fn::GetAtt":["API","RootResourceId"]},
            "MethodResponses": [{"StatusCode": 200}],
            "RestApiId":{"Ref":"API"} 
          }
        },
        "Deployment": {
          "Type": "AWS::ApiGateway::Deployment",
          "Properties": {
            "RestApiId": {"Ref": "API"}
          },
          "DependsOn":"get"
        },
        "Stage":{
          "Type": "AWS::ApiGateway::Stage",
          "Properties": {
            "DeploymentId": {"Ref": "Deployment"},
            "RestApiId": {"Ref": "API"},
            "StageName":"test"
          }
        }
   },
   "Outputs": {
        "ApiId":{
            "Value":{"Ref":"API"}
        },
        "Stage":{
            "Value":"test"
        }
   }
}
