var stack=require('../util').stacktest
var config=require('../../config')
module.exports={
  "Resources": {
    "master":stack('master',{
        Email:config.devEmail,
        BootstrapBucket:{"Fn::ImportValue":"QNA-BOOTSTRAP-BUCKET"},
        BootstrapPrefix:{"Fn::ImportValue":"QNA-BOOTSTRAP-PREFIX"},
        PublicOrPrivate:"PRIVATE",
        ApprovedDomain:"amazon.com"
    })
  },
  "Outputs":{
    "Bucket":{
        "Value":{"Fn::GetAtt":["master","Outputs.DesignerBucket"]},
        "Export":{
            "Name":"QNA-DEV-WEB-BUCKET"
        }
    },
    "HandlerArn":{
        "Value":{"Fn::GetAtt":["master","Outputs.HandlerArn"]},
        "Export":{
            "Name":"QNA-DEV-HANDLER-ARN"
        }
    }

  },
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Development QnABot master template"
}
