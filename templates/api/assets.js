var fs=require('fs')

module.exports={
    "AssetBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {}
    },
    "AssetClear":{
        "Type": "Custom::S3Clear",
        "DependsOn":["CFNLambdaPolicy"],
        "Condition":"BuildExamples",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket":{"Ref":"AssetBucket"}
        }
    },
    "AssetUnzip":{
        "Type": "Custom::S3Unzip",
        "Condition":"BuildExamples",
        "DependsOn":["CFNLambdaPolicy","AssetClear"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "SrcBucket":{"Ref":"BootstrapBucket"},
            "Key":{"Fn::Join":["",[
                {"Ref":"BootstrapPrefix"},
                "/assets.zip"
            ]]},
            "DstBucket":{"Ref":"AssetBucket"},
            "buildDate":new Date()
        }
    }
}


