var fs=require('fs')

module.exports={
  "Resources": {
    "Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "VersioningConfiguration":{
            "Status":"Enabled"
        },
        "LifecycleConfiguration":{
            "Rules":[{
                "Status":"Enabled",
                "NoncurrentVersionExpirationInDays":1
            }]
        }
      }
    },
    "Clear":{
        "Type": "Custom::S3Clear",
        "DependsOn":["CFNLambdaPolicy"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket":{"Ref":"Bucket"}
        }
    },
    "CFNLambda":{
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "ZipFile":fs.readFileSync(__dirname+'/handler.js','utf-8')
        },
        "Handler": "index.handler",
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["CFNLambdaRole","Arn"]},
        "Runtime": "nodejs8.10",
        "Timeout": 60
      }
    },
    "CFNLambdaRole":{
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Path": "/",
        "ManagedPolicyArns": [
            "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            {"Ref":"CFNLambdaPolicy"}
        ]
      }
    },
    "CFNLambdaPolicy":{
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "s3:*"
              ],
              "Resource":[
                {"Fn::Sub":"arn:aws:s3:::${Bucket}*"},
              ]
            }
          ]
        }
      }
    },
    "ReadPolicy":{
        "Type" : "AWS::S3::BucketPolicy",
        "Condition":"Public",
        "Properties" : {
            "Bucket" : {"Ref":"Bucket"},
            "PolicyDocument" : {
                "Version":"2012-10-17",
                "Statement":[{
                    "Sid":"PublicReadForGetBucketObjects",
                    "Effect":"Allow",
                    "Principal":{"AWS":"*"},
                    "Action":["s3:Get*","s3:List*"],
                    "Resource":[
                        {"Fn::Sub":"arn:aws:s3:::${Bucket}*"}
                    ]
                }]
            }
        }
    }
  },
  "Conditions": {},
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Bootstrap bucket for QnABot assets",
  "Mappings": {},
  "Outputs": {
    "Bucket": {
      "Value": {
        "Ref": "Bucket"
      }
    },
    "Prefix": {
      "Value": "artifacts/aws-ai-qna-bot"
    }
  },
  "Parameters": {
    "Public":{
        "Type":"String",
        "Default":"PRIVATE"
    }
  },
  "Conditions":{
    "Public":{"Fn::Equals":[{"Ref":"Public"},"PUBLIC"]}
  }
}


