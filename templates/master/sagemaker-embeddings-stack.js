module.exports={
    "SagemakerEmbeddingsStack":{
        "Type" : "AWS::CloudFormation::Stack",
        "Condition":"EmbeddingsSagemaker",
        "Properties" : {
            "TemplateURL" :{"Fn::Sub":"https://${BootstrapBucket}.s3.${AWS::Region}.amazonaws.com/${BootstrapPrefix}/templates/sagemaker-embeddings.json"},
            "Parameters" :{
                "CFNLambda":{"Fn::GetAtt":["CFNLambda","Arn"]},
                "BootstrapBucket":{"Ref":"BootstrapBucket"},
                "BootstrapPrefix":{"Ref":"BootstrapPrefix"},
                "SagemakerInitialInstanceCount":{"Ref":"SagemakerInitialInstanceCount"},
                "VPCSubnetIdList":{"Fn::Join":[",",{"Ref":"VPCSubnetIdList"}]},
                "VPCSecurityGroupIdList":{"Fn::Join":[",",{"Ref":"VPCSecurityGroupIdList"}]},
            }
        }
    }
}