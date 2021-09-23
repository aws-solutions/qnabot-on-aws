var util = require('../util');

module.exports={
    "AssetBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketEncryption": {
            "Fn::If": [
                "Encrypted",
                {
                    "ServerSideEncryptionConfiguration": [{
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }]
                },
                {
                    "Ref": "AWS::NoValue"
                }
            ]
        },
        "PublicAccessBlockConfiguration": {
            "BlockPublicAcls": true,
            "BlockPublicPolicy": true,
            "IgnorePublicAcls": true,
            "RestrictPublicBuckets": true
          }
      },
      "Metadata": util.cfnNag(["W35"])
    },
    "HTTPSOnlyAssetBucketPolicy": util.httpsOnlyBucketPolicy("AssetBucket"),
    "AssetClear":{
        "Type": "Custom::S3Clear",
        "DependsOn":["CFNInvokePolicy"],
        "Condition":"BuildExamples",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket":{"Ref":"AssetBucket"}
        }
    },
    "AssetZipVersion":{
        "Condition":"BuildExamples",
        "Type": "Custom::S3Version",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket": {"Ref":"BootstrapBucket"},
            "Key": {"Fn::Join":["",[
                {"Ref":"BootstrapPrefix"},
                "/assets.zip"
            ]]},
            "BuildDate":(new Date()).toISOString()
        }
    },
    "AssetUnzip":{
        "Type": "Custom::S3Unzip",
        "Condition":"BuildExamples",
        "DependsOn":["AssetClear"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "SrcBucket":{"Ref":"BootstrapBucket"},
            "Key":{"Fn::Join":["",[
                {"Ref":"BootstrapPrefix"},
                "/assets.zip"
            ]]},
            "DstBucket":{"Ref":"AssetBucket"},
            "version":{"Ref":"AssetZipVersion"}
        }
    }
};


