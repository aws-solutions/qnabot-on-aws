var stack=require('../util').stacktest
module.exports={
  "Resources": {
    "master":stack('master',{
        Email:'jcalho@amazon.com',
        BootstrapBucket:{"Fn::ImportValue":"QNA-BOOTSTRAP-BUCKET"},
        BootstrapPrefix:{"Fn::ImportValue":"QNA-BOOTSTRAP-PREFIX"},
        PublicOrPrivate:"PRIVATE"
    })
  },
  "Outputs":{
    "Bucket":{
        "Value":{"Fn::GetAtt":["master","Outputs.DesignerBucket"]},
        "Export":{
            "Name":"QNA-DEV-WEB-BUCKET"
        }
    }
  },
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Development QnABot master template"
}
