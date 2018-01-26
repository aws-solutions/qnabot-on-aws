var fs=require('fs')

module.exports={
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
}


