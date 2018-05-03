module.exports={
    "ImportBucket":{
        "Type" : "AWS::S3::Bucket",
        "Properties":{
            LifecycleConfiguration:{
                Rules:[{
                    ExpirationInDays:1,
                    Status:"Enabled"
                }]
            },
            "VersioningConfiguration":{
                "Status":"Enabled"
            },
            "CorsConfiguration":{
                CorsRules:[{
                    AllowedHeaders:['*'],
                    AllowedMethods:['PUT'],
                    AllowedOrigins:['*']
                }]
            }
        }
    },
    "ImportClear":{
        "Type": "Custom::S3Clear",
        "DependsOn":["CFNInvokePolicy"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket":{"Ref":"ImportBucket"}
        }
    },
    "ImportTrigger":{
        "Type": "Custom::S3Lambda",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket":{"Ref":"ImportBucket"},
            NotificationConfiguration:{
                LambdaFunctionConfigurations:[{
                    LambdaFunctionArn:{"Fn::GetAtt":["ImportStartLambda","Arn"]},
                    Events:["s3:ObjectCreated:*"],
                    Filter:{Key:{FilterRules:[{
                        Name:"prefix",
                        Value:"data"
                    }]}}
                },{
                    LambdaFunctionArn:{"Fn::GetAtt":["ImportStepLambda","Arn"]},
                    Events:["s3:ObjectCreated:*"],
                    Filter:{Key:{FilterRules:[{
                        Name:"prefix",
                        Value:"status"
                    }]}}
                }]
            }
        }
    },
    "ImportStartPermission":{
        "Type": "AWS::Lambda::Permission",
        "Properties": {
            "FunctionName":{"Fn::GetAtt":["ImportStartLambda","Arn"]},
            "Action": "lambda:InvokeFunction",
            "Principal": "s3.amazonaws.com",
            "SourceAccount": {"Ref": "AWS::AccountId"},
            "SourceArn":{"Fn::Sub":"arn:aws:s3:::${ImportBucket}"}
        }
    },
    "ImportStepPermission":{
        "Type": "AWS::Lambda::Permission",
        "Properties": {
            "FunctionName":{"Fn::GetAtt":["ImportStepLambda","Arn"]},
            "Action": "lambda:InvokeFunction",
            "Principal": "s3.amazonaws.com",
            "SourceAccount": {"Ref": "AWS::AccountId"},
            "SourceArn":{"Fn::Sub":"arn:aws:s3:::${ImportBucket}"}
        }
    }

}
