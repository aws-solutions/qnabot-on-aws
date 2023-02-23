module.exports={
    "ImportStack":{
        "Type" : "AWS::CloudFormation::Stack",
        "DependsOn":["PreUpgradeExport","OpensearchDomainUpdate"],
        "Properties" : {
            "TemplateURL" :{"Fn::Sub":"https://${BootstrapBucket}.s3.${AWS::Region}.amazonaws.com/${BootstrapPrefix}/templates/import.json"},
            "Parameters" :{
                "CFNLambda":{"Fn::GetAtt":["CFNLambda","Arn"]},
                "CFNInvokePolicy":{"Ref":"CFNInvokePolicy"},
                "BootstrapBucket":{"Ref":"BootstrapBucket"},
                "BootstrapPrefix":{"Ref":"BootstrapPrefix"},
                "EsEndpoint": {"Fn::GetAtt": ["ESVar", "ESAddress"]},
                "EsArn": {"Fn::GetAtt":["ESVar","ESArn"]},
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
                "AwsSdkLayerLambdaLayer":{"Ref":"AwsSdkLayerLambdaLayer"},
                "CommonModulesLambdaLayer":{"Ref":"CommonModulesLambdaLayer"},
                "EsProxyLambdaLayer":{"Ref":"EsProxyLambdaLayer"},
                "QnABotCommonLambdaLayer":{"Ref":"QnABotCommonLambdaLayer"},
                "EmbeddingsLambdaArn":{"Ref": "EmbeddingsLambdaArn"},
                "EmbeddingsApi": {"Ref": "EmbeddingsApi"},
                "EmbeddingsLambdaDimensions": {"Ref": "EmbeddingsLambdaDimensions"},
                "EmbeddingsLambdaArn": {"Ref": "EmbeddingsLambdaArn"},
                "EmbeddingsSagemakerEndpoint": {
                    "Fn::If": [
                        "EmbeddingsSagemaker", 
                        {"Fn::GetAtt": ["SagemakerEmbeddingsStack", "Outputs.EmbeddingsSagemakerEndpoint"] }, 
                        ""
                    ]
                },
                "EmbeddingsSagemakerEndpointArn": {
                    "Fn::If": [
                        "EmbeddingsSagemaker", 
                        {"Fn::GetAtt": ["SagemakerEmbeddingsStack", "Outputs.EmbeddingsSagemakerEndpointArn"] }, 
                        ""
                    ]
                  }
            }
        }
    }
}
