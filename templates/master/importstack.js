module.exports={
    "ImportStack":{
        "Type" : "AWS::CloudFormation::Stack",
        "Properties" : {
            "TemplateURL" :{"Fn::Sub":"http://s3.amazonaws.com/${BootstrapBucket}/${BootstrapPrefix}/templates/import.json"},
            "Parameters" :{
                "CFNLambda":{"Fn::GetAtt":["CFNLambda","Arn"]},
                "CFNInvokePolicy":{"Ref":"CFNInvokePolicy"},
                "BootstrapBucket":{"Ref":"BootstrapBucket"},
                "BootstrapPrefix":{"Ref":"BootstrapPrefix"},
                "VarIndex": {"Fn::GetAtt": ["Var", "index"]},
                "EsEndpoint": {"Fn::GetAtt": ["ESVar", "ESAddress"]},
                "EsProxyLambda": {"Fn::GetAtt":["ESProxyLambda","Arn"]},
                "ImportBucket": {"Ref":"ImportBucket"},
            }
        }
    }
}