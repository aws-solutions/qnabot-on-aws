module.exports={
    "ExportStack":{
        "Type" : "AWS::CloudFormation::Stack",
        "Properties" : {
            "TemplateURL" :{"Fn::Sub":"http://${BootstrapBucket}.s3.${AWS::Region}.amazonaws.com/${BootstrapPrefix}/templates/export.json"},
            "Parameters" :{
                "CFNLambda":{"Fn::GetAtt":["CFNLambda","Arn"]},
                "CFNInvokePolicy":{"Ref":"CFNInvokePolicy"},
                "BootstrapBucket":{"Ref":"BootstrapBucket"},
                "BootstrapPrefix":{"Ref":"BootstrapPrefix"},
                "VarIndex": {"Fn::GetAtt": ["Var", "QnaIndex"]},
                "EsEndpoint": {"Fn::GetAtt": ["ESVar", "ESAddress"]},
                "EsProxyLambda": {"Fn::GetAtt":["ESProxyLambda","Arn"]},
                "ExportBucket": {"Ref":"ExportBucket"},
                "VPCSubnetIdList" : { "Fn::Join" : [ ",", {"Ref":"VPCSubnetIdList"} ] },
                "VPCSecurityGroupIdList": { "Fn::Join" : [ ",", {"Ref":"VPCSecurityGroupIdList"} ] },
                "XraySetting":{"Ref": "XraySetting"},
                "Api":{"Ref":"API"},
                "ApiRootResourceId":{"Fn::GetAtt":["API","RootResourceId"]},
                "Encryption":{"Ref":"Encryption"},
                "Stage":{"Ref":"Stage"},
                "ApiDeploymentId":{"Ref":"Deployment"},
                "KendraCrawlerSnsTopic":{"Ref":"KendraCrawlerSnsTopic"},
                "DefaultQnABotSettings":{"Ref":"DefaultQnABotSettings"},
                "CustomQnABotSettings":{"Ref":"CustomQnABotSettings"},
                "LexVersion": {"Fn::If": ["CreateLexV1Bots","V1","V2"]},
                // Lex V1
                "FallbackIntent": {"Fn::If": ["CreateLexV1Bots",{"Ref": "IntentFallback"},"LexV2Only_Mode"]},
                "Intent":{"Fn::If": ["CreateLexV1Bots",{"Ref": "Intent"},"LexV2Only_Mode"]},
                "BotName":{"Fn::If": ["CreateLexV1Bots",{"Ref": "LexBot"},"LexV2Only_Mode"]},
                // Lex V2
                "LexV2BotName": {"Fn::GetAtt":["LexV2Bot","botName"]},
                "LexV2BotId": {"Fn::GetAtt":["LexV2Bot","botId"]},
                "LexV2BotAlias": {"Fn::GetAtt":["LexV2Bot","botAlias"]},
                "LexV2BotAliasId": {"Fn::GetAtt":["LexV2Bot","botAliasId"]},
                "LexV2BotLocaleIds": {"Fn::GetAtt":["LexV2Bot","botLocaleIds"]},
            }
        }
    }
}