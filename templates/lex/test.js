var stack=require('../util').stacktest
module.exports={
  "Resources": {
    "QnABot":stack('lex',{
        "Address":{"Fn::ImportValue":"QNA-DEV-ES-ADDRESS"},
        "DomainArn":{"Fn::ImportValue":"QNA-DEV-ES-ARN"},
        "Type":"test-type",
        "Index":"test-index",
        "EmptyMessage":"test",
        "ErrorMessage":"test"
    })
  },
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Test of the QnABot API template"
}
