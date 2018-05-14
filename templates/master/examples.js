module.exports={
    "ExamplesStack":{
        "Type" : "AWS::CloudFormation::Stack",
        "Condition":"BuildExamples",
        "Properties" : {
            "TemplateURL" :{"Fn::Sub":"http://s3.amazonaws.com/${BootstrapBucket}/${BootstrapPrefix}/templates/examples.json"},
            "Parameters" :{
                "QnAType":{"Fn::GetAtt":["Var","QnAType"]}, 
                "QuizType":{"Fn::GetAtt":["Var","QuizType"]},
                "Index":{"Fn::GetAtt":["Var","index"]},
                "ESAddress":{"Fn::GetAtt":["ESVar","ESAddress"]},
                "BootstrapBucket":{"Ref":"BootstrapBucket"},
                "BootstrapPrefix":{"Ref":"BootstrapPrefix"},
                "FeedbackFirehose":{"Fn::GetAtt":["FeedbackFirehose","Arn"]},
                "CFNLambda":{"Fn::GetAtt":["CFNLambda","Arn"]},
                "CFNLambdaRole":{"Fn::GetAtt":["CFNLambdaRole","Arn"]},
                "ApiUrlName":{"Fn::GetAtt":["ApiUrl","Name"]},
                "AssetBucket":{"Ref":"AssetBucket"},
                "FulfillmentLambdaRole":{"Ref": "FulfillmentLambdaRole"}
            }
        }
    }
}
