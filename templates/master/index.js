module.exports={
  "Parameters":{
    "BootstrapPrefix":{
        "Type":"String",
        "Description":"Path to QnABot assets in the BoostrapBucket",
        "Default":""
    },
    "BootstrapBucket":{
        "Type":"String",
        "Description":"AWS S3 bucket where assets are stored"
    },
    "Email":{
        "Type":"String",
        "Description":"Email address for the admin user. Will be used for loging in and for setting the admin password.",
        "AllowedPattern":".+\@.+\..+",
        "ConstraintDescription":"Must be valid email address eg. johndoe@example.com"
    },
    "Username":{
        "Type":"String",
        "Description":"Administrator username",
        "Default":"Admin"
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
    }
  },
  "Resources":Object.assign(
    require('./stacks')
  ),
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "QnABot with admin and client websites",
  "Outputs":{
    "DesignerBucket":{
        "Value":{"Fn::GetAtt":["api","Outputs.Bucket"]}
    },
    "BotName":{
        "Value":{"Fn::GetAtt":["QnABot","Outputs.Bot"]}
    },
    "IntentName":{
        "Value":{"Fn::GetAtt":["QnABot","Outputs.Intent"]}
    },
    "HandlerArn":{
        "Value":{"Fn::GetAtt":["QnABot","Outputs.HandlerArn"]}
    },
    "ContentDesignerLogin":{
        "Value":{"Fn::GetAtt":["api","Outputs.DesignerLogin"]}
    },
    "ClientURL":{
        "Value":{"Fn::GetAtt":["api","Outputs.ClientLogin"]}
    },
    "ClientLogin":{
        "Value":{"Fn::GetAtt":["api","Outputs.ClientUrl"]}
    },
    "DashboardUrl":{
        "Value":{"Fn::GetAtt":["dashboard","Outputs.Url"]}
    },
    "UserPoolUrl":{
        "Value":{"Fn::GetAtt":["api","Outputs.UserPoolUrl"]}
    }
  },
  "Metadata" : {
    "AWS::CloudFormation::Interface" : {
        "ParameterGroups" : [
            {
                "Label":"Bootstrap Configuration",
                "Parameters":["BootstrapBucket","BootstrapPrefix"]
            },
            {
                "Label":"Administrator Configuration",
                "Parameters":["Email","Username"]
            },
            {
                "Label":"Security",
                "Parameters":["PublicOrPrivate","ApprovedDomain"]
            }
        ]
    }
  }
}
