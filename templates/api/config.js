module.exports={
"API": {
  "Type": "AWS::ApiGateway::RestApi",
  "Properties": {
    "Name": {"Ref": "AWS::StackName"},
    "Description":"An Api interface for the admin actions on the QNA bot"
  },
  "DependsOn": ["InvokePermissionESProxy","InvokePermissionLexProxy","InvokePermissionLexBuild","InvokePermissionSchema"]
},
"Deployment": {
  "Type": "AWS::ApiGateway::Deployment",
  "Properties": {
    "RestApiId": {
      "Ref": "API"
    }
  },
  "DependsOn": [
    "ClientLoginResourceGet",
    "DesignerLoginResourceGet",
    "AlexaSchema",
    "HooksGet",
    "HooksPut",
    "HooksOptions",
    "QuestionsGet",
    "QuestionsPut",
    "QuestionHead",
    "QuestionPut",
    "QuestionsOptions",
    "QuestionDelete",
    "QuestionsDelete",
    "BotPost",
    "BotGet",
    "UtterancesGet",
    "rootGet",
    "HealthGet",
    "ProxyAnyGet",
    "ProxyAnyHead"
  ]
},
"Stage":stage('prod'),
"DevStage":stage('dev'),
"ApiGatewayAccount": {
  "Type": "AWS::ApiGateway::Account",
  "Properties": {
    "CloudWatchRoleArn": {
      "Fn::GetAtt": [
        "ApiGatewayCloudWatchLogsRole",
        "Arn"
      ]
    }
  }
},
"DocumentationVersion": {
    "Type": "AWS::ApiGateway::DocumentationVersion",
    "DependsOn":["BotDoc"],
    "Properties": {
        "Description":"",
        "DocumentationVersion":"1.0",
        "RestApiId": {"Ref": "API"}
    }
}
}

function stage(name){
    return {
      "Type": "AWS::ApiGateway::Stage",
      "Properties": {
        "DeploymentId": {
          "Ref": "Deployment"
        },
        "RestApiId": {
          "Ref": "API"
        },
        "StageName":name,
        "MethodSettings": [{
            "DataTraceEnabled": true,
            "HttpMethod": "*",
            "LoggingLevel": "INFO",
            "ResourcePath": "/*"
        }],
        "Variables":{
            "Region":{"Ref":"AWS::Region"},
            "AccountId":{"Ref":"AWS::AccountId"},
            "IdPool":{"Ref":"IdPool"},
            "ClientIdClient":{"Ref":"ClientClient"},
            "ClientIdDesigner":{"Ref":"ClientDesigner"},
            "UserPool":{"Ref":"UserPool"},
            "Id":{"Ref":"Id"},
            "BotName":{"Ref":"Botname"},
            "SlotType":{"Ref":"SlotType"},
            "Intent":{"Ref":"Intent"},
            "ESEndpoint":{"Ref":"ESAddress"},
            "ESIndex":{"Ref":"ESIndex"},
            "ESType": {"Ref":"ESType"},
            "LambdaArn":{"Ref":"HandlerArn"},
            "DesignerLoginUrl":{"Fn::Join":["",[
                {"Fn::GetAtt":["ApiUrl","Name"]},
                "/pages/designer"
              ]]},
            "ClientLoginUrl":{"Fn::If":[
                "Public",
                {"Fn::GetAtt":["Urls","Client"]},
                {"Fn::Join":["",[
                    {"Fn::GetAtt":["ApiUrl","Name"]},
                    "/pages/client"
                ]]}
            ]}
        }
      }
    }
}
