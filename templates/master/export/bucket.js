module.exports={
    "ExportBucket":{
        "Type" : "AWS::S3::Bucket",
        "Properties":{
            LifecycleConfiguration:{
                Rules:[{
                    NoncurrentVersionExpirationInDays:1,
                    Status:"Enabled"
                },{
                    AbortIncompleteMultipartUpload:{
                        DaysAfterInitiation:1
                    },
                    Status:"Enabled"
                }]
            },
            "VersioningConfiguration":{
                "Status":"Enabled"
            },
            "CorsConfiguration":{
                CorsRules:[{
                    AllowedHeaders:['*'],
                    AllowedMethods:['GET'],
                    AllowedOrigins:['*']
                }]
            }
        }
    },
    "ExportClear":{
        "Type": "Custom::S3Clear",
        "DependsOn":["CFNInvokePolicy"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket":{"Ref":"ExportBucket"}
        }
    },
    "ExportTrigger":{
        "Type": "Custom::S3Lambda",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
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
