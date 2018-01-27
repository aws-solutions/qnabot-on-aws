var fs=require('fs')

module.exports=Object.assign(require('./lambda'),{
    "LambdaHookExamples":{
        "Type": "Custom::QnABotExamples",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["ExampleWriteLambda", "Arn"] },
            "Bucket": {"Ref":"AssetBucket"},
            "Example1":{"Ref":"ExampleHookLambda1"}
        }
    },
    "ExampleCodeVersion":{
        "Type": "Custom::S3Version",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket": {"Ref":"BootstrapBucket"},
            "Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/examples.zip"},
            "BuildDate":(new Date()).toISOString()
        }
    },
    "ExampleWriteLambda":{
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Join":["",[
                {"Ref":"BootstrapPrefix"},
                "/lambda/examples.zip"
            ]]},
            "S3ObjectVersion":{"Ref":"ExampleCodeVersion"}
        },
        "Handler": "cfn.handler",
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["CFNLambdaRole","Arn"]},
        "Runtime": "nodejs6.10",
        "Timeout": 300
      }
    },
    "AssetBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {}
    },
    "AssetClear":{
        "Type": "Custom::S3Clear",
        "DependsOn":["CFNLambdaPolicy"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket":{"Ref":"AssetBucket"}
        }
    },
    "AssetUnzip":{
        "Type": "Custom::S3Unzip",
        "DependsOn":["CFNLambdaPolicy"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "SrcBucket":{"Ref":"BootstrapBucket"},
            "Key":{"Fn::Join":["",[
                {"Ref":"BootstrapPrefix"},
                "/assets.zip"
            ]]},
            "DstBucket":{"Ref":"AssetBucket"},
            "buildDate":new Date()
        },
        "DependsOn":"AssetClear"
    }
})


