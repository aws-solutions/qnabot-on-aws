var fs=require('fs')
module.exports={
    "CognitoDomain":{
        "Type": "Custom::CognitoDomain",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "UserPool":{"Ref":"UserPool"}
        }
    },
    "CognitoLoginClient":{
        "Type": "Custom::CognitoLogin",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "UserPool":{"Ref":"UserPool"},
            "ClientId":{"Ref":"ClientClient"},
            "LoginCallbackUrls":[
                {"Fn::GetAtt":["Urls","Client"]}
            ],
            "CSS":require('./style').client
        }
    },
    "CognitoLoginDesigner":{
        "Type": "Custom::CognitoLogin",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "UserPool":{"Ref":"UserPool"},
            "ClientId":{"Ref":"ClientDesigner"},
            "LoginCallbackUrls":[
                {"Fn::GetAtt":["Urls","Designer"]},
            ],
            "CSS":require('./style').designer
        }
    },
    "DesignerLogin":{
        "Type": "Custom::CognitoUrl",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "adad":"adaad",
            "ClientId":{"Ref":"ClientDesigner"},
            "Domain":{"Ref":"CognitoDomain"},
            "LoginRedirectUrl":{"Fn::GetAtt":["Urls","Designer"]}
        }
    },
    "ClientLogin":{
        "Type": "Custom::CognitoUrl",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "ClientId":{"Ref":"ClientClient"},
            "Domain":{"Ref":"CognitoDomain"},
            "LoginRedirectUrl":{"Fn::GetAtt":["Urls","Client"]}
        }
    },
    "User":{
        "Type" : "AWS::Cognito::UserPoolUser",
        "DependsOn":["SignupPermision","MessagePermision"],
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
        "CognitoIdentityProviders": [{
            "ClientId": {"Ref": "ClientDesigner"},
            "ProviderName": {"Fn::GetAtt": ["UserPool","ProviderName"]},
            "ServerSideTokenCheck": true
          },{
            "ClientId": {"Ref": "ClientClient"},
            "ProviderName": {"Fn::GetAtt": ["UserPool","ProviderName"]},
            "ServerSideTokenCheck": true
          }
        ]
      }
    },
    "RoleAttachment": {
        "Type": "Custom::CognitoRole",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "IdentityPoolId":{"Ref":"IdPool"},
            "Roles":{
                "authenticated":{"Fn::GetAtt":["UserRole","Arn"]},
                "unauthenticated":{"Fn::GetAtt":["UnauthenticatedRole","Arn"]} 
            },
            "RoleMappings":[{
                "ClientId":{"Ref":"ClientClient"},
                "UserPool":{"Ref":"UserPool"},
                "Type":"Rules",
                "AmbiguousRoleResolution":"AuthenticatedRole",
                "RulesConfiguration":{"Rules":[{
                    "Claim":"cognito:groups",
                    "MatchType":"Contains",
                    "Value":"Admin",
                    "RoleARN":{"Fn::GetAtt":["UserRole","Arn"]}
                }]}
            },{
                "ClientId":{"Ref":"ClientDesigner"},
                "UserPool":{"Ref":"UserPool"},
                "Type":"Rules",
                "AmbiguousRoleResolution":"Deny",
                "RulesConfiguration":{"Rules":[{
                    "Claim":"cognito:groups",
                    "MatchType":"Contains",
                    "Value":"Admin",
                    "RoleARN":{"Fn::GetAtt":["AdminRole","Arn"]}
                }]}
            }]
        }
    },
    "UserPool": {
      "Type": "AWS::Cognito::UserPool",
      "Properties": {
        "UserPoolName": {"Fn::Join": ["-",["UserPool",{"Ref": "AWS::StackName"}]]},
        "AdminCreateUserConfig":{
           "AllowAdminCreateUserOnly":{"Fn::If":["AdminSignUp",true,false]},
           "InviteMessageTemplate":{
                "EmailMessage":{"Fn::Sub":fs.readFileSync(__dirname+'/invite.txt','utf8')},
                "EmailSubject":"Welcome to QnABot!"
           }
        },
        "AliasAttributes":["email"],
        "AutoVerifiedAttributes":["email"],
        "Schema":[{
            "Required":true,
            "Name":"email",
            "AttributeDataType":"String",
            "Mutable":true
        }],
        "LambdaConfig":{
            "CustomMessage":{"Fn::GetAtt":["MessageLambda","Arn"]},
            "PreSignUp":{"Fn::GetAtt":["SignupLambda","Arn"]}
        }
    }
    },
    "ClientDesigner": {
      "Type": "AWS::Cognito::UserPoolClient",
      "Properties": {
        "ClientName": {"Fn::Join": ["-",[
            "UserPool",
            {"Ref": "AWS::StackName"},
            "designer"
        ]]},
        "GenerateSecret": false,
        "UserPoolId": {"Ref": "UserPool"}
      }
    },
    "ClientClient": {
      "Type": "AWS::Cognito::UserPoolClient",
      "Properties": {
        "ClientName": {"Fn::Join": ["-",[
            "UserPool",
            {"Ref": "AWS::StackName"},
            "client"
        ]]},
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
