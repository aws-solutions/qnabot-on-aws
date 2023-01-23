module.exports={
    "ImportStack":{
        "Type" : "AWS::CloudFormation::Stack",
        "DependsOn":["PreUpgradeExport","ElasticsearchDomainUpdate"],
        "Properties" : {
            "TemplateURL" :{"Fn::Sub":"https://${BootstrapBucket}.s3.${AWS::Region}.amazonaws.com/${BootstrapPrefix}/templates/import.json"},
            "Parameters" :{
                "CFNLambda":{"Fn::GetAtt":["CFNLambda","Arn"]},
                "CFNInvokePolicy":{"Ref":"CFNInvokePolicy"},
                "BootstrapBucket":{"Ref":"BootstrapBucket"},
                "BootstrapPrefix":{"Ref":"BootstrapPrefix"},
                "EsEndpoint": {"Fn::GetAtt": ["ESVar", "ESAddress"]},
                "EsProxyLambda": {"Fn::GetAtt":["ESProxyLambda","Arn"]},
                "ImportBucket": {"Ref":"ImportBucket"},
                "ExportBucket": {"Ref":"ExportBucket"},
                "VarIndex": {"Fn::GetAtt": ["Var", "QnaIndex"]},
                "MetricsIndex": {"Fn::GetAtt": ["Var", "MetricsIndex"]},
                "FeedbackIndex": {"Fn::GetAtt": ["Var", "FeedbackIndex"]},
                "DefaultQnABotSettings":{"Ref":"DefaultQnABotSettings"},
                "CustomQnABotSettings":{"Ref":"CustomQnABotSettings"},
                "Encryption": {"Ref":"Encryption"},
                "VPCSubnetIdList" : { "Fn::Join" : [ ",", {"Ref":"VPCSubnetIdList"} ] },
                "VPCSecurityGroupIdList": { "Fn::Join" : [ ",", {"Ref":"VPCSecurityGroupIdList"} ] },
                "XraySetting":{"Ref": "XraySetting"},
                "EmbeddingsLambdaArn":{"Ref": "EmbeddingsLambdaArn"},
                "EmbeddingsApi": {"Ref": "EmbeddingsApi"},
                "EmbeddingsLambdaDimensions": {"Ref": "EmbeddingsLambdaDimensions"},
                "EmbeddingsLambdaArn": {"Ref": "EmbeddingsLambdaArn"},
                "EmbeddingsSagemakerEndpoint": {
                    "Fn::If": [
                        "EmbeddingsSagemakerProvisioned", 
                        {"Fn::GetAtt":["QnABotSMProvisionedEmbeddingEndpoint","EndpointName"]}, 
                        {
                            "Fn::If": [
                                "EmbeddingsSagemakerServerless", 
                                {"Fn::GetAtt":["QnABotSMServerlessEmbeddingEndpoint","EndpointName"]},
                                ""
                            ]
                        }
                    ]
                },
            }
        }
    }
}