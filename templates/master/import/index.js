var fs=require('fs')

module.exports=Object.assign(
    require('./bucket'),{
    "ImportCodeVersion":{
        "Type": "Custom::S3Version",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket": {"Ref":"BootstrapBucket"},
            "Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/import.zip"},
            "BuildDate":(new Date()).toISOString()
        }
    },
    "ImportStartLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/import.zip"},
            "S3ObjectVersion":{"Ref":"ImportCodeVersion"}
        },
        "Environment": {
            "Variables": {
                STRIDE:"1000000"
            }
        },
        "Handler": "index.start",
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["ImportRole","Arn"]},
        "Runtime": "nodejs8.10",
        "Timeout": 300,
        "Tags":[{
            Key:"Type",
            Value:"Import"
        }]
      }
    },
    "ImportStepLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/import.zip"},
            "S3ObjectVersion":{"Ref":"ImportCodeVersion"}
        },
        "Environment": {
            "Variables": {
                ES_INDEX:{"Fn::GetAtt":["Var","index"]},
                ES_ENDPOINT:{"Fn::GetAtt":["ESVar","ESAddress"]},
                ES_PROXY:{"Fn::GetAtt":["ESProxyLambda","Arn"]}
            }
        },
        "Handler": "index.step",
        "MemorySize": "320",
        "Role": {"Fn::GetAtt": ["ImportRole","Arn"]},
        "Runtime": "nodejs8.10",
        "Timeout": 300,
        "Tags":[{
            Key:"Type",
            Value:"Import"
        }]
      }
    },
    "ImportRole": {
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
          {"Ref":"ImportPolicy"}
        ]
      }
    },
    "ImportPolicy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [{
              "Effect": "Allow",
              "Action": [
                "s3:*"
              ],
              "Resource":[{"Fn::Sub":"arn:aws:s3:::${ImportBucket}*"}]
          },{
              "Effect": "Allow",
              "Action": [
                "lambda:InvokeFunction"
              ],
              "Resource":[{"Fn::GetAtt":["ESProxyLambda","Arn"]}]
          }]
        }
      }
    }
})

