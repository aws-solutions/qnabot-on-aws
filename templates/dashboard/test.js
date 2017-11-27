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
    }),
    "api":stack('api',{
        "HandlerArn":{"Fn::GetAtt":["QnABot","Outputs.HandlerArn"]},
        "Botname":"bot",
        "SlotType":"slot",
        "Intent":"intent",
        "Email":"jcalho@amazon.com",
        "Utterances":"ad"
    }),
    "dashboard":stack('dashboard',{
        "Name":{"Ref":"AWS::StackName"},
        "APIGateWay":{"Fn::GetAtt":["api","Outputs.ApiId"]},
        "ESDomain":{"Fn::ImportValue":"QNA-DEV-ES-NAME"},
        "BotName":{"Fn::GetAtt":["QnABot","Outputs.Bot"]},
        "Handler":{"Fn::GetAtt":["QnABot","Outputs.HandlerArn"]}
    })
  },
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Test of the QnABot API template"
}
