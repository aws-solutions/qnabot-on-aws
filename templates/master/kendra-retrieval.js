module.exports={
    "KendraRetrievalStack":{
        "Type" : "AWS::CloudFormation::Stack",
        "Properties" : {
            "TemplateURL" :{"Fn::Sub":"https://${BootstrapBucket}.s3.${AWS::Region}.amazonaws.com/${BootstrapPrefix}/templates/kendra-retrieval.yaml"},
            "Parameters" :{
                "AssetBucket":{"Ref":"AssetBucket"}
            }
        }
    }
}