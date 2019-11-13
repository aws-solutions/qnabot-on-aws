module.exports={
    "TestAllTrigger":{
        "Type": "Custom::S3Lambda",
        "Properties": {
            "ServiceToken": { "Ref" : "CFNLambda"},
            "Bucket":{"Ref":"TestAllBucket"},
            NotificationConfiguration:{
                LambdaFunctionConfigurations:[{
                    LambdaFunctionArn:{"Fn::GetAtt":["TestAllStepLambda","Arn"]},
                    Events:["s3:ObjectCreated:*"],
                    Filter:{Key:{FilterRules:[{
                        Name:"prefix",
                        Value:"status"
                    }]}}
                }]
            }
        }
    },
    "TestAllStepPermission":{
        "Type": "AWS::Lambda::Permission",
        "Properties": {
            "FunctionName":{"Fn::GetAtt":["TestAllStepLambda","Arn"]},
            "Action": "lambda:InvokeFunction",
            "Principal": "s3.amazonaws.com",
            "SourceAccount": {"Ref": "AWS::AccountId"},
            "SourceArn":{"Fn::Sub":"arn:aws:s3:::${TestAllBucket}"}
        }
    }

}
