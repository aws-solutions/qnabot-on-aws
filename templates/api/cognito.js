var fs=require('fs')
module.exports={
    "CognitoDomain":{
        "Type": "Custom::CognitoDomain",
        "DependsOn":["CFNLambdaPolicy"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "UserPool":{"Ref":"UserPool"}
        }
    },
    "CognitoLogin":{
        "Type": "Custom::CognitoLogin",
        "DependsOn":["CFNLambdaPolicy"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "UserPool":{"Ref":"UserPool"},
            "ClientId":{"Ref":"Client"},
            "LoginCallbackUrls":[
                {"Fn::GetAtt":["Urls","Designer"]},
                {"Fn::GetAtt":["Urls","Client"]}
            ],
            "CSS":require('./style')
        }
    },
    "DesignerLogin":{
        "Type": "Custom::CognitoUrl",
        "DependsOn":["CFNLambdaPolicy"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "ClientId":{"Ref":"Client"},
            "Domain":{"Ref":"CognitoDomain"},
            "LoginRedirectUrl":{"Fn::GetAtt":["Urls","Designer"]}
        }
    },
    "ClientLogin":{
        "Type": "Custom::CognitoUrl",
        "DependsOn":["CFNLambdaPolicy"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "ClientId":{"Ref":"Client"},
            "Domain":{"Ref":"CognitoDomain"},
            "LoginRedirectUrl":{"Fn::GetAtt":["Urls","Client"]}
        }
    },
    "User":{
        "Type" : "AWS::Cognito::UserPoolUser",
        "Properties" : {
            "DesiredDeliveryMediums":["EMAIL"],
            "UserAttributes":[{
                "Name":"email",
                "Value":{"Ref":"Email"}
            }],
            "Username":{"Ref":"Username"},
            "UserPoolId":{"Ref":"UserPool"}
        }
    },
    "UserToGroup":{
      "Type" : "AWS::Cognito::UserPoolUserToGroupAttachment",
      "Properties" : {
        "GroupName" : {"Ref":"Admins"},
        "Username" : {"Ref":"User"},
        "UserPoolId" : {"Ref":"UserPool"}
      }
    },
    "IdPool": {
      "Type": "AWS::Cognito::IdentityPool",
      "Properties": {
        "IdentityPoolName": "UserPool",
        "AllowUnauthenticatedIdentities": true,
        "CognitoIdentityProviders": [
          {
            "ClientId": {
              "Ref": "Client"
            },
            "ProviderName": {
              "Fn::GetAtt": [
                "UserPool",
                "ProviderName"
              ]
            },
            "ServerSideTokenCheck": true
          }
        ]
      }
    },
    "RoleAttachment": {
        "Type": "Custom::CognitoRole",
        "DependsOn":["CFNLambdaPolicy"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "IdentityPoolId":{"Ref":"IdPool"},
            "Roles":{
                "authenticated":{"Fn::GetAtt":["UserRole","Arn"]},
                "unauthenticated":{"Fn::GetAtt":["UnauthenticatedRole","Arn"]} 
            },
            "RoleMappings":[{
                "ClientId":{"Ref":"Client"},
                "UserPool":{"Ref":"UserPool"},
                "Type":"Rules",
                "AmbiguousRoleResolution":"Deny",
                "RulesConfiguration":{"Rules":[{
                    "Claim":"cognito:groups",
                    "MatchType":"Contains",
                    "Value":"Admin",
                    "RoleARN":{"Fn::GetAtt":["AdminRole","Arn"]}
                },{
                    "Claim":"cognito:groups",
                    "MatchType":"Contains",
                    "Value":"User",
                    "RoleARN":{"Fn::GetAtt":["UserRole","Arn"]}
                }]}
            }]
        }
    },
    "UserPool": {
      "Type": "AWS::Cognito::UserPool",
      "Properties": {
        "UserPoolName": {"Fn::Join": ["-",["UserPool",{"Ref": "AWS::StackName"}]]},
        "AdminCreateUserConfig":{
           "AllowAdminCreateUserOnly":true,
           "InviteMessageTemplate":{
                "EmailMessage":{"Fn::Sub":fs.readFileSync(__dirname+'/invite.txt','utf8')},
                "EmailSubject":"Welcome to QnABot!"
           }
        },
        "AliasAttributes":["email"]
      }
    },
    "Client": {
      "Type": "AWS::Cognito::UserPoolClient",
      "Properties": {
        "ClientName": {
          "Fn::Join": [
            "-",
            [
              "UserPool",
              {
                "Ref": "AWS::StackName"
              }
            ]
          ]
        },
        "GenerateSecret": false,
        "UserPoolId": {"Ref": "UserPool"}
      }
    },
    "Users":{
      "Type" : "AWS::Cognito::UserPoolGroup",
      "Properties" : {
        "GroupName" : "Users",
        "UserPoolId": {"Ref": "UserPool"}
      }
    },
    "Admins":{
      "Type" : "AWS::Cognito::UserPoolGroup",
      "Properties" : {
        "GroupName" : "Admins",
        "UserPoolId": {"Ref": "UserPool"}
      }
    }
}
