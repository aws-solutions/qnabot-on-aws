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
        "Default":"Admin"
    },
    "PublicOrPrivate":{
        "Type":"String",
        "Description":"Where access to the QnABot should be publicly available or restricted to users in QnABot UserPool",
        "AllowedPattern":"(PUBLIC|PRIVATE)",
        "ConstraintDescription":"Allowed Values are PUBLIC or PRIVATE"
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
  }
}
