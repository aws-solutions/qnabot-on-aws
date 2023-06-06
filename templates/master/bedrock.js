module.exports={
    "BedrockStack":{
        "Type" : "AWS::CloudFormation::Stack",
        "Condition":"Bedrock",
        "Properties" : {
            "TemplateURL" :{"Fn::Sub":"https://${BootstrapBucket}.s3.${AWS::Region}.amazonaws.com/${BootstrapPrefix}/templates/bedrock.yaml"},
            "Parameters" :{}
        }
    }
}