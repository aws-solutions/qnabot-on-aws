module.exports={
    "ExamplesStack":{
        "Type" : "AWS::CloudFormation::Stack",
        "Condition":"BuildExamples",
        "Properties" : {
            "TemplateURL" :{"Fn::Sub":"http://${BootstrapBucket}.s3.${AWS::Region}.amazonaws.com/${BootstrapPrefix}/templates/examples.json"},
            "Parameters" :{
                "QnAType":{"Fn::GetAtt":["Var","QnAType"]}, 
                "QuizType":{"Fn::GetAtt":["Var","QuizType"]},
                "Index":{"Fn::GetAtt":["Var","QnaIndex"]},
                "ESAddress":{"Fn::GetAtt":["ESVar","ESAddress"]},
                "BootstrapBucket":{"Ref":"BootstrapBucket"},
                "BootstrapPrefix":{"Ref":"BootstrapPrefix"},
                "FeedbackFirehose":{"Fn::GetAtt":["FeedbackFirehose","Arn"]},
                "FeedbackFirehoseName":{"Ref":"FeedbackFirehose"},
                "CFNLambda":{"Fn::GetAtt":["CFNLambda","Arn"]},
                "CFNLambdaRole":{"Fn::GetAtt":["CFNLambdaRole","Arn"]},
                "LexV2CFNLambdaARN":{"Fn::GetAtt":["LexV2CfnCr","Outputs.LexV2CfnCrFunctionArn"]},
                "LexV2ServiceLinkedRoleARN":{"Fn::GetAtt":["LexV2CfnCr","Outputs.LexServiceLinkedRole"]},
                "ApiUrlName":{"Fn::GetAtt":["ApiUrl","Name"]},
                "AssetBucket":{"Ref":"AssetBucket"},
                "FulfillmentLambdaRole":{"Ref": "FulfillmentLambdaRole"},
                "QIDLambdaArn":{"Fn::GetAtt":["ESQidLambda","Arn"]},
                "VPCSubnetIdList" : { "Fn::Join" : [ ",", {"Ref":"VPCSubnetIdList"} ] },
                "VPCSecurityGroupIdList": { "Fn::Join" : [ ",", {"Ref":"VPCSecurityGroupIdList"} ] },
                "LexBotVersion": {"Ref": "LexBotVersion"},
                "XraySetting":{"Ref": "XraySetting"},
            }
        }
    }
}
