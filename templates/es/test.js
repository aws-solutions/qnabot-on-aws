var stack=require('../util').stacktest
module.exports={
  "Resources": {
    "es":stack('es',{
        "Arn":{"Fn::ImportValue":"QNA-DEV-ES-ARN"},
        "Address":{"Fn::ImportValue":"QNA-DEV-ES-ADDRESS"}
    })
  },
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Test of the QnABot API template"
}
