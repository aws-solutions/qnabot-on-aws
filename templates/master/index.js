var fs=require('fs')
var _=require('lodash')

var files=fs.readdirSync(`${__dirname}`)
    .filter(x=>!x.match(/README.md|Makefile|index|test|.DS_Store/))
    .map(x=>require(`./${x}`))

module.exports={
  "Resources":_.assign.apply({},files),
  "Conditions": {},
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": `QnABot with admin and client websites - (Master v${process.env.npm_package_version})`,
  "Mappings": {},
  "Outputs": {
    "CognitoEndpoint":{
        "Value":{"Fn::GetAtt":["DesignerLogin","Domain"]}
    },
    "UserRole":{
      "Value":{"Ref":"UserRole"}
    },
    "ImportBucket":{
      "Value":{"Ref":"ImportBucket"}
    },
    "BotConsoleUrl":{
      "Value":{"Fn::Join":["",[
        "https://console.aws.amazon.com/lex/home?",
        "region=",{"Ref":"AWS::Region"},
        "#bot-editor:bot=",{"Ref":"LexBot"}
      ]]}
    },
    "BotName":{
        "Value":{"Ref":"LexBot"}
    },
    "BotAlias":{
        "Value":{"Ref":"VersionAlias"}
    },
    "SlotType":{
        "Value":{"Ref":"SlotType"}
    },
    "Intent":{
        "Value":{"Ref":"Intent"}
    },
    "IntentFallback":{
        "Value":{"Ref":"IntentFallback"}
    },
    "DashboardURL":{
        "Value":{"Fn::Join":["",[
            "https://console.aws.amazon.com/cloudwatch/home?",
            "region=",{"Ref":"AWS::Region"},
            "#dashboards:name=",{"Ref":"dashboard"}
        ]]}
    },
    "UserPoolURL":{
        "Value":{"Fn::Join":["",[
            "https://console.aws.amazon.com/cognito/users/",
            "?region=",{"Ref":"AWS::Region"},
            "#/pool/",{"Ref":"UserPool"},"/details"
        ]]}
    },
    "Bucket":{
      "Value":{"Ref":"Bucket"}
    },
    "IdPool":{
      "Value":{"Ref":"IdPool"}
    },
    "ApiEndpoint":{
      "Value":{"Fn::GetAtt":["ApiUrl","Name"]}
    },
    "ESProxyLambda":{
        "Value":{"Fn::GetAtt":["ESProxyLambda","Arn"]}
    },
    "CFNESProxyLambda":{
        "Value":{ "Fn::GetAtt" : ["ESCFNProxyLambda", "Arn"]}
    },
    "ContentDesignerURL": {
      "Value":{"Fn::Join":["",[
        {"Fn::GetAtt":["ApiUrl","Name"]},
        "/pages/designer"
      ]]}
    },
    "ClientURL": {
        "Value":{"Fn::If":["Public",
            {"Fn::GetAtt":["Urls","Client"]},
            {"Fn::Join":["",[
                {"Fn::GetAtt":["ApiUrl","Name"]},
                "/pages/client"
            ]]}
        ]}
    },
    "ApiId":{
      "Value": {"Ref":"API"}
    },
    "UserPool":{
      "Value":{"Ref":"UserPool"}
    },
    "DesignerClientId":{
      "Value":{"Ref":"ClientDesigner"}
    },
    "ClientClientId":{
      "Value":{"Ref":"ClientClient"}
    },
    "ElasticsearchEndpoint":{
      "Value":{"Fn::GetAtt":["ESVar","ESAddress"]}
    },
    "ElasticsearchQnAType":{
      "Value":{"Fn::GetAtt":["Var","QnAType"]}
    },
    "ElasticsearchQuizType":{
       "Value":{"Fn::GetAtt":["Var","QuizType"]}
    },
    "ElasticsearchIndex":{
      "Value":{"Fn::GetAtt":["Var","index"]}
    },
    "UsersTable":{
      "Value":{"Ref":"UsersTable"}
    },
    "DefaultSettingsSSMParameterName":{
      "Value":{"Ref":"DefaultQnABotSettings"}
    },
    "CustomSettingsSSMParameterName":{
      "Value":{"Ref":"CustomQnABotSettings"}
    },
    "DefaultUserPoolJwksUrlParameterName": {
      "Value":{"Ref":"DefaultUserPoolJwksUrl"}
    }
  },
  "Parameters": {
    "ElasticsearchName":{
        "Type":"String",
        "Default":"EMPTY"
    },
    "AdminUserSignUp":{
      "Type":"String",
      "AllowedPattern":"(FALSE|TRUE)",
      "ConstraintDescription":"Allowed Values are FALSE or TRUE",
      "Default":"TRUE"
    },
    "Encryption":{
        "Type":"String",
        "Description":"Choose whether resources (S3 and ElasticSearch) are encrypted at rest. Selecting encrypted configuration will provision c5.large.elasticsearch instances - see https://aws.amazon.com/elasticsearch-service/pricing/.",
        "AllowedValues": ["ENCRYPTED", "UNENCRYPTED"],
        "Default":"UNENCRYPTED",
        "ConstraintDescription":"Allowed Values are UNENCRYPTED or ENCRYPTED"
    },
    "ApprovedDomain":{
        "Type":"String",
        "Description":"(optional) If QnABot is private, restrict user sign up to users whos email domain matches this domain. eg. amazon.com",
        "Default":"NONE"
    },
    "Email":{
        "Type":"String",
        "Description":"Email address for the admin user. Will be used for loging in and for setting the admin password. This email will receive the temporary password for the admin user.",
        "AllowedPattern":".+\\@.+\\..+",
        "ConstraintDescription":"Must be valid email address eg. johndoe@example.com"
    },
    "Username":{
        "Type":"String",
        "Description":"Administrator username",
        "Default":"Admin"
    },
    "BootstrapBucket":{
        "Type":"String"
    },
    "BootstrapPrefix":{
        "Type":"String"
    },
    "BuildExamples":{
      "Type":"String",
      "Default":"TRUE"
    },
    "PublicOrPrivate":{
        "Type":"String",
        "Description":"Choose whether access to the QnABot client should be publicly available or restricted to users in QnABot UserPool.",
        "AllowedValues" : ["PUBLIC", "PRIVATE"],
        "Default":"PUBLIC"
    },
    "ElasticSearchNodeCount":{
        "Type":"String",
        "Description":"Number of nodes in ElasticSearch domain - '4' is recommended for fault tolerant production deployments.",
        "AllowedValues" : ["2", "4"],
        "Default":"2"
    },
    "VPCSubnetIdList" : {
        "Description" : "Subnet IDs", "Type": "CommaDelimitedList",
        "Default": ""
    },
    "VPCSecurityGroupIdList": {
        "Description" : "Security Group IDs", "Type": "CommaDelimitedList",
        "Default": ""
    },
    "XraySetting":{
        "Type":"String",
        "Description": "Configure Lambdas with X-Ray enabled",
        "AllowedValues": ["FALSE", "TRUE"],
        "Default":"FALSE",
        "ConstraintDescription":"Allowed Values are FALSE or TRUE"
    },
  },
  "Conditions":{
    "Public":{"Fn::Equals":[{"Ref":"PublicOrPrivate"},"PUBLIC"]},
    "Encrypted":{"Fn::Equals":[{"Ref":"Encryption"}, "ENCRYPTED"]},
    "AdminSignUp":{"Fn::Equals":[{"Ref":"AdminUserSignUp"},"TRUE"]},
    "XRAYEnabled":{"Fn::Equals":[{"Ref":"XraySetting"},"TRUE"]},
    "Domain":{"Fn::Not":[{"Fn::Equals":[{"Ref":"ApprovedDomain"},"NONE"]}]},
    "BuildExamples":{"Fn::Equals":[{"Ref":"BuildExamples"},"TRUE"]},
    "CreateDomain":{"Fn::Equals":[{"Ref":"ElasticsearchName"},"EMPTY"]},
    "DontCreateDomain":{"Fn::Not":[{"Fn::Equals":[{"Ref":"ElasticsearchName"},"EMPTY"]}]},
    "VPCEnabled": { "Fn::Not": [
              { "Fn::Equals": [ "",
                      { "Fn::Join": [ "", { "Ref": "VPCSecurityGroupIdList" } ] }
                  ] }
          ] }
  }
}





