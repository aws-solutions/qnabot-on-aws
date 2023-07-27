module.exports={
    "SageMakerQASummarizeLLMStack":{
        "Type" : "AWS::CloudFormation::Stack",
        "Condition":"LLMSagemaker",
        "Properties" : {
            "TemplateURL" :{"Fn::Sub":"https://${BootstrapBucket}.s3.${AWS::Region}.amazonaws.com/${BootstrapPrefix}/templates/sagemaker-qa-summarize-llm.json"},
            "Parameters" :{
                "CFNLambda":{"Fn::GetAtt":["CFNLambda","Arn"]},
                "BootstrapBucket":{"Ref":"BootstrapBucket"},
                "BootstrapPrefix":{"Ref":"BootstrapPrefix"},
                "SagemakerInstanceType":{"Ref":"LLMSagemakerInstanceType"},
                "SagemakerInitialInstanceCount":{"Ref":"LLMSagemakerInitialInstanceCount"},
                "VPCSubnetIdList":{"Fn::Join":[",",{"Ref":"VPCSubnetIdList"}]},
                "VPCSecurityGroupIdList":{"Fn::Join":[",",{"Ref":"VPCSecurityGroupIdList"}]},
            }
        }
    }
}