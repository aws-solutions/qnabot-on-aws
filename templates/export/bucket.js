module.exports={
    "ExportTriggerFromS3":{
        "Type": "Custom::S3Lambda",
        "Properties": {
            "ServiceToken": { "Ref" : "CFNLambda"},
            "Bucket":{"Ref":"ExportBucket"},
            NotificationConfiguration:{
                LambdaFunctionConfigurations:[{
                    LambdaFunctionArn:{"Fn::GetAtt":["ExportStepLambda","Arn"]},
                    Events:["s3:ObjectCreated:*"],
                    Filter:{Key:{FilterRules:[{
                        Name:"prefix",
                        Value:"status"
                    }]}}
                }]
            }
        }
    },
    "ExportStepPermission":{
        "Type": "AWS::Lambda::Permission",
        "Properties": {
            "FunctionName":{"Fn::GetAtt":["ExportStepLambda","Arn"]},
            "Action": "lambda:InvokeFunction",
            "Principal": "s3.amazonaws.com",
            "SourceAccount": {"Ref": "AWS::AccountId"},
            "SourceArn":{"Fn::Sub":"arn:aws:s3:::${ExportBucket}"}
        }
    }

}
