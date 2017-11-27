var stack=require('../util').stack
var config=require('./config')
module.exports={
    "domain":stack('domain'),
    "es":stack('es',{
        "Address":{ "Fn::GetAtt" : ["domain", "Outputs.ESAddress"] },
        "Arn":{ "Fn::GetAtt" : ["domain", "Outputs.ESArn"] }
    }),
    "var":{
        "Type": "Custom::Variable",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["Variable", "Arn"] },
            "Address":{ "Fn::GetAtt" : ["domain", "Outputs.ESAddress"] },
            "DomainArn":{ "Fn::GetAtt" : ["domain", "Outputs.ESArn"] },
            "Index":{"Fn::GetAtt":["es","Outputs.Index"]},
            "Type":{"Fn::GetAtt":["es","Outputs.Type"]},
            "ErrorMessage":config.ErrorMessage,
            "EmptyMessage":config.EmptyMessage
        }
    },
    "QnABot":stack('lex',{
        "Address":{ "Fn::GetAtt" : ["var", "Address"] },
        "DomainArn":{ "Fn::GetAtt" : ["var", "DomainArn"] },
        "Type":{ "Fn::GetAtt" : ["var", "Type"] },
        "Index":{ "Fn::GetAtt" : ["var", "Index"] },
        "EmptyMessage":{ "Fn::GetAtt" : ["var", "ErrorMessage"] },
        "ErrorMessage":{ "Fn::GetAtt" : ["var", "EmptyMessage"] }
    }),
    "api":stack('api',{
        "HandlerArn":{"Fn::GetAtt":["QnABot","Outputs.HandlerArn"]},
        "Botname":{"Fn::GetAtt":["QnABot","Outputs.Bot"]},
        "SlotType":{"Fn::GetAtt":["QnABot","Outputs.SlotType"]},
        "Intent":{"Fn::GetAtt":["QnABot","Outputs.Intent"]},
        "Username":{"Ref":"Username"},
        "Email":{"Ref":"Email"},
        "Utterances":{"Fn::Join":["\n",
            require('../../lambda/handler/lib/default-utterances')
        ]}
    }),
    "dashboard":stack('dashboard',{
        "Name":{"Ref":"AWS::StackName"},
        "APIGateWay":{"Fn::GetAtt":["api","Outputs.Name"]},
        "ESDomain":{"Fn::GetAtt":["domain","Outputs.ESDomain"]},
        "BotName":{"Fn::GetAtt":["QnABot","Outputs.Bot"]},
        "Handler":{"Fn::GetAtt":["QnABot","Outputs.HandlerName"]}
    })
}
