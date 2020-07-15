var fs=require('fs')
var _=require('lodash')

var files=fs.readdirSync(`${__dirname}`)
    .filter(x=>!x.match(/README.md|Makefile|index|test|outputs|.DS_Store/))
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
    "SyncCodeVersion":{
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
        "MemorySize": "1024",
        "Role": {"Fn::GetAtt": ["ExportRole","Arn"]},
        "Runtime": "nodejs10.x",
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
        "MemorySize": "1024",
        "Role": {"Fn::GetAtt": ["ExportRole","Arn"]},
        "Runtime": "nodejs10.x",
        "Timeout": 300,
        "Tags":[{
            Key:"Type",
            Value:"Export"
        }]
      }
    },
    "KendraSyncLambda": {
        "Type": "AWS::Lambda::Function",
        "Properties": {
            "Code": {
                "S3Bucket": {"Ref":"BootstrapBucket"},
                "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/export.zip"},
                "S3ObjectVersion":{"Ref":"SyncCodeVersion"}
            },
            "Environment": {
                "Variables": {
                    // "KENDRA_INDEX":{"Ref":"KendraFAQIndex"},
                    // "DEFAULT_USER_POOL_JWKS_PARAM": { "Ref": "DefaultUserPoolJwksUrl" },
                    // "DEFAULT_SETTINGS_PARAM": { "Ref": "DefaultQnABotSettings" },
                    // "CUSTOM_SETTINGS_PARAM": { "Ref": "CustomQnABotSettings" },
                    "OUTPUT_S3_BUCKET":{"Ref":"ExportBucket"},
                    "KENDRA_ROLE":{"Fn::GetAtt": ["KendraS3Role","Arn"]},
                    // "REGION":{"Ref":"AWS::Region"}
                }
            },
            "Handler": "kendraSync.performSync",
            "MemorySize": "1024",
            "Role": {"Fn::GetAtt": ["KendraSyncRole","Arn"]},
            "Runtime": "nodejs10.x",
            "Timeout": 300,
            "Tags":[{
                Key:"Type",
                Value:"Sync"
            }]
        }
    },
    "KendraSyncRole": {
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
            },{
              "Effect": "Allow",
              "Principal": {
                "Service": "kendra.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Path": "/",
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          {"Ref":"KendraSyncPolicy"}
        ]
      }
    },
    "KendraSyncPolicy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "PolicyDocument": {
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
              "s3:PutObject",
              "s3:GetObject",
              "kendra:CreateFaq",
              "kendra:ListFaqs",
              "s3:ListBucket",
              "kendra:TagResource",
              "kendra:DeleteFaq",
              "iam:passRole"
            ],
            "Resource": [
                {"Fn::Sub":"arn:aws:kendra:${AWS::Region}:${AWS::AccountId}:index/*"},
                {"Fn::Sub":"arn:aws:kendra:${AWS::Region}:${AWS::AccountId}:index/*/faq/*"},
                {"Fn::Sub":"arn:aws:s3:::${ExportBucket}"},
                {"Fn::Sub":"arn:aws:s3:::${ExportBucket}/*"},
                {"Fn::GetAtt": ["KendraS3Role","Arn"]}
            ]
          }]
        }
      }
    },
    "KendraS3Role": {
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
            },{
              "Effect": "Allow",
              "Principal": {
                "Service": "kendra.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Path": "/",
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          {"Ref":"KendraS3Policy"}
        ]
      }
    },
    "KendraS3Policy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "PolicyDocument": {
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
              "s3:GetObject",
              "kendra:CreateFaq",
            ],
            "Resource": [
                {"Fn::Sub":"arn:aws:kendra:${AWS::Region}:${AWS::AccountId}:index/*"},
                {"Fn::Sub":"arn:aws:s3:::${ExportBucket}"},
                {"Fn::Sub":"arn:aws:s3:::${ExportBucket}/*"},
            ]
          }]
        }
      }
    }
  }
)


