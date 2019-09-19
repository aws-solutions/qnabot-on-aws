var fs=require('fs')
var _=require('lodash')

var files=fs.readdirSync(`${__dirname}`)
    .filter(x=>!x.match(/README.md|Makefile|index|test|outputs/))
    .map(x=>require(`./${x}`))

module.exports=Object.assign(
    {
    "ExportCodeVersion":{
        "Type": "Custom::S3Version",
        "Properties": {
            "ServiceToken": { "Ref" : "CFNLambda" },
            "Bucket": {"Ref":"BootstrapBucket"},
            "Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/export.zip"},
            "BuildDate":(new Date()).toISOString()
        }
    },
    "ExportStepLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/export.zip"},
            "S3ObjectVersion":{"Ref":"ExportCodeVersion"}
        },
        "Environment": {
            "Variables": {
                ES_INDEX:{"Ref":"VarIndex"},
                ES_ENDPOINT:{"Ref":"EsEndpoint"},
                ES_PROXY:{"Ref":"EsProxyLambda"}
            }
        },
        "Handler": "index.step",
        "MemorySize": "320",
        "Role": {"Fn::GetAtt": ["ExportRole","Arn"]},
        "Runtime": "nodejs8.10",
        "Timeout": 300,
        "Tags":[{
            Key:"Type",
            Value:"Export"
        }]
      }
    },
    "ExportRole": {
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
          {"Ref":"ExportPolicy"}
        ]
      }
    },
    "ExportPolicy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [{
              "Effect": "Allow",
              "Action": [
                "s3:*"
              ],
              "Resource":[{"Fn::Sub":"arn:aws:s3:::${ExportBucket}*"}]
          },{
              "Effect": "Allow",
              "Action": [
                "lambda:InvokeFunction"
              ],
              "Resource":[{"Ref":"EsProxyLambda"}]
          }]
        }
      }
    },
    "ExportClear":{
        "Type": "Custom::S3Clear",
        "Properties": {
            "ServiceToken": { "Ref" : "CFNLambda" },
            "Bucket":{"Ref":"ExportBucket"}
        }
    }
})

