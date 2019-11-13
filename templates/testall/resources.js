var fs=require('fs')
var _=require('lodash')

var files=fs.readdirSync(`${__dirname}`)
    .filter(x=>!x.match(/README.md|Makefile|index|test|outputs/))
    .map(x=>require(`./${x}`))

module.exports=Object.assign(
    {
    "TestAllCodeVersion":{
        "Type": "Custom::S3Version",
        "Properties": {
            "ServiceToken": { "Ref" : "CFNLambda" },
            "Bucket": {"Ref":"BootstrapBucket"},
            "Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/testall.zip"},
            "BuildDate":(new Date()).toISOString()
        }
    },
    "TestAllStepLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/testall.zip"},
            "S3ObjectVersion":{"Ref":"TestAllCodeVersion"}
        },
        "Environment": {
            "Variables": {
                ES_INDEX:{"Ref":"VarIndex"},
                ES_ENDPOINT:{"Ref":"EsEndpoint"},
                ES_PROXY:{"Ref":"EsProxyLambda"},
                BOT_NAME:{"Ref":"BotName"},
                BOT_ALIAS:{"Ref":"BotAlias"}
            }
        },
        "Handler": "index.step",
        "MemorySize": "1280",
        "Role": {"Fn::GetAtt": ["TestAllRole","Arn"]},
        "Runtime": "nodejs8.10",
        "Timeout": 900,
        "Tags":[{
            Key:"Type",
            Value:"TestAll"
        }]
      }
    },
    "TestAllRole": {
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
        ],
        "Policies": [
          {
            "PolicyName" : "TestAllPolicy",
            "PolicyDocument" : {
              "Version": "2012-10-17",
              "Statement": [{
                  "Effect": "Allow",
                  "Action": [
                    "s3:*"
                  ],
                  "Resource":[{"Fn::Sub":"arn:aws:s3:::${TestAllBucket}*"}]
              },{
                  "Effect": "Allow",
                  "Action": [
                    "lambda:InvokeFunction"
                  ],
                  "Resource":[{"Ref":"EsProxyLambda"}]
              },
                {
                  "Effect": "Allow",
                  "Action": [
                      "lex:PostContent",
                      "lex:PostText"
                  ],
                  "Resource": [
                      "*"
                  ]
                }
              ]
            }
          }
        ]
      }
    },
    "TestAllClear":{
        "Type": "Custom::S3Clear",
        "Properties": {
            "ServiceToken": { "Ref" : "CFNLambda" },
            "Bucket":{"Ref":"TestAllBucket"}
        }
    }
})

