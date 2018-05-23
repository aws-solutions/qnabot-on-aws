var _=require('lodash')
var methods=[]
_.forEach(require('./routes'),(value,key)=>{
    value.Type==='AWS::ApiGateway::Method' ? methods.push(key) : null
})
var permissions=_.keys(require('./lambda'))
    .filter(x=>x.match(/^InvokePermission/))
    .filter(x=>![
        'InvokePermissionLexBuildLambda',
        'InvokePermissionLexBuildLambdaPoll',
        'InvokePermissionLexStatusLambda'
        ].includes(x))


module.exports={
"API": {
  "Type": "AWS::ApiGateway::RestApi",
  "Properties": {
    "Name": {"Ref": "AWS::StackName"},
    "Description":"An Api interface for the admin actions on the QNA bot",
    "BinaryMediaTypes":["image/png"]
  },
  "DependsOn":permissions 
},
"ApiCompression":{
    "Type": "Custom::ApiCompression",
    "Properties": {
        "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
        "restApiId": {"Ref": "API"},
        "value":"500000"
    }
},
"Deployment":{
    "Type": "Custom::ApiDeployment",
    "Properties": {
        "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
        "restApiId": {"Ref": "API"},
        "buildDate":new Date(),
        "stage":"prod"
    },
    "DependsOn":methods
},
"Stage":stage('prod'),
"ApiGatewayAccount": {
  "Type": "AWS::ApiGateway::Account",
  "Properties": {
    "CloudWatchRoleArn": {
      "Fn::GetAtt": ["ApiGatewayCloudWatchLogsRole","Arn"]
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
            "Id":"QnABot",
            "Region":{"Ref":"AWS::Region"},
            "CognitoEndpoint":{"Fn::GetAtt":["DesignerLogin","Domain"]},
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
