module.exports={
    "TestAllStack":{
        "Type" : "AWS::CloudFormation::Stack",
        "Properties" : {
            "TemplateURL" :{"Fn::Sub":"http://s3.amazonaws.com/${BootstrapBucket}/${BootstrapPrefix}/templates/testall.json"},
            "Parameters" :{
                "CFNLambda":{"Fn::GetAtt":["CFNLambda","Arn"]},
                "CFNInvokePolicy":{"Ref":"CFNInvokePolicy"},
                "BotName":{"Ref":"LexBot"},
                "BotAlias":{"Ref":"Alias"},
                "BootstrapBucket":{"Ref":"BootstrapBucket"},
                "BootstrapPrefix":{"Ref":"BootstrapPrefix"},
                "VarIndex": {"Fn::GetAtt": ["Var", "index"]},
                "EsEndpoint": {"Fn::GetAtt": ["ESVar", "ESAddress"]},
                "EsProxyLambda": {"Fn::GetAtt":["ESProxyLambda","Arn"]},
                "TestAllBucket": {"Ref":"TestAllBucket"},
            }
        }
    }
}