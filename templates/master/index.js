var fs=require('fs')
var _=require('lodash')

var files=fs.readdirSync(`${__dirname}`)
    .filter(x=>!x.match(/README.md|Makefile|index|test/))
    .map(x=>require(`./${x}`))

module.exports={
  "Resources":_.assign.apply({},files),
  "Conditions": {},
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "QnABot with admin and client websites",
  "Mappings": {},
  "Outputs": {
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
    "SlotType":{
        "Value":{"Ref":"SlotType"}
    },
    "Intent":{
        "Value":{"Ref":"Intent"}
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
    "ApiEndpoint":{
      "Value":{"Fn::GetAtt":["ApiUrl","Name"]}
    },
    "ESProxyLambda":{
        "Value":{"Fn::GetAtt":["ESProxyLambda","Arn"]}
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
    "NextLambda":{
      "Value":{"Fn::GetAtt":["ExamplePYTHONLambdaNext","Arn"]}
    },
    "PreviousLambda":{
      "Value":{"Fn::GetAtt":["ExamplePYTHONLambdaPrevious", "Arn"]}
    },
    "TriviaRefactoredLambda":{
      "Value":{"Fn::GetAtt":["ExamplePYTHONLambdaTriviaRefactored", "Arn"]}
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
    "PublicOrPrivate":{
        "Type":"String",
        "Description":"(optional) Whether access to the QnABot should be publicly available or restricted to users in QnABot UserPool. Allowed values are PUBLIC or PRIVATE",
        "AllowedPattern":"(PUBLIC|PRIVATE)",
        "Default":"PUBLIC",
        "ConstraintDescription":"Allowed Values are PUBLIC or PRIVATE"
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
    }
  },
  "Conditions":{
    "Public":{"Fn::Equals":[{"Ref":"PublicOrPrivate"},"PUBLIC"]},
    "AdminSignUp":{"Fn::Equals":[{"Ref":"AdminUserSignUp"},"TRUE"]},
    "Domain":{"Fn::Not":[{"Fn::Equals":[{"Ref":"ApprovedDomain"},"NONE"]}]},
    "BuildExamples":{"Fn::Equals":[{"Ref":"BuildExamples"},"TRUE"]},
    "CreateDomain":{"Fn::Equals":[{"Ref":"ElasticsearchName"},"EMPTY"]},
    "DontCreateDomain":{"Fn::Not":[{"Fn::Equals":[{"Ref":"ElasticsearchName"},"EMPTY"]}]}
  }
}





