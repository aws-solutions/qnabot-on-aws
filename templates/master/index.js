var exp=require('../../bin/exports')
module.exports=exp().then(function(vars){
var base={
  "Parameters":{
    "BootstrapPrefix":{
        "Type":"String",
        "Description":"Path to QnABot assets in the BoostrapBucket (DO NOT CHANGE)",
        "Default":""
    },
    "BootstrapBucket":{
        "Type":"String",
        "Description":"AWS S3 bucket where assets are stored (DO NOT CHANGE)"
    },
    "Email":{
        "Type":"String",
        "Description":"Email address for the admin user. Will be used for loging in and for setting the admin password. This email will receive the temporary password for the admin user.",
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
        "Value":{"Fn::GetAtt":["api","Outputs.DesignerLogin"]},
        "Description":"Url to login to the QnABot Designer Ui to edit and create questions for your bot"
    },
    "ClientURL":{
        "Value":{"Fn::GetAtt":["api","Outputs.ClientUrl"]},
        "Description":"If your bot is PUBLIC then this is the login your users will use to interact with your bot"
    },
    "ClientLogin":{
        "Value":{"Fn::GetAtt":["api","Outputs.ClientLogin"]},
        "Description":"If your bot is PRIVATE then this is the url your users will use to interact with your bot. This is also the registration url for new users"
    },
    "DashboardUrl":{
        "Value":{"Fn::GetAtt":["dashboard","Outputs.Url"]}
    },
    "UserPoolUrl":{
        "Value":{"Fn::GetAtt":["api","Outputs.UserPoolUrl"]},
        "Description":"Where you will manage users for your QnABot."
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
    
    base.Parameters.BootstrapBucket.Default=vars["QNA-BOOTSTRAP-BUCKET"]
    base.Parameters.BootstrapPrefix.Default=vars["QNA-BOOTSTRAP-PREFIX"]
    
    return base
})
