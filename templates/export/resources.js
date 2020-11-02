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
    "ConnectCodeVersion":{
          "Type": "Custom::S3Version",
          "Properties": {
              "ServiceToken": { "Ref" : "CFNLambda" },
              "Bucket": {"Ref":"BootstrapBucket"},
              "Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/connect.zip"},
              "BuildDate":(new Date()).toISOString()
          }
      },
      "ConnectLambda": {
        "Type": "AWS::Lambda::Function",
        "Properties": {
          "Code": {
              "S3Bucket": {"Ref":"BootstrapBucket"},
              "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/connect.zip"},
              "S3ObjectVersion":{"Ref":"ConnectCodeVersion"}
          },
          "Environment": {
              "Variables": {
                fallBackIntent:{"Ref":"FallbackIntent"},
                intent:{"Ref":"Intent"},
                lexBot:{"Ref":"BotName"},
                outputBucket:{"Ref":"ExportBucket"},
                s3Prefix:"connect/"
              }
          },
          "Handler": "index.handler",
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
      "ConnectApiResource": {
        "Type": "AWS::ApiGateway::Resource",
        "Properties": {
          "ParentId": {"Ref": "ApiRootResourceId"},
          "PathPart": "connect",
          "RestApiId": {"Ref": "Api"}
        }
      },
      "InvokePermissionConnectLambda": {
        "Type": "AWS::Lambda::Permission",
        "Properties": {
          "Action": "lambda:InvokeFunction",
          "FunctionName": {"Fn::GetAtt": ["ConnectLambda", "Arn"]},
          "Principal": "apigateway.amazonaws.com"
        }
      },
      "Deployment":{
        "Type": "Custom::ApiDeployment",
        "DeletionPolicy":"Retain",
        "DependsOn":["ConnectGet","ConnectApiResource","InvokePermissionConnectLambda"],
        "Properties": {
          "ServiceToken": { "Ref" : "CFNLambda" },
          "restApiId": {"Ref": "Api"},
            "buildDate":new Date(),
            "stage":"prod",
            "ApiDeploymentId": {"Ref": "ApiDeploymentId"},
            "Encryption":{"Ref": "Encryption"}
        },
    },
      "ConnectGet": {
        "Type": "AWS::ApiGateway::Method",
        "Properties": {
          "AuthorizationType": "AWS_IAM",
          "HttpMethod": "GET",
          "RestApiId": {"Ref": "Api"},
          "ResourceId": {"Ref": "ConnectApiResource"},
          "Integration": {
            "Type": "AWS",
            "IntegrationHttpMethod": "POST",
            "Uri": {
              "Fn::Join": [
                "",
                [
                  "arn:aws:apigateway:",
                  {"Ref": "AWS::Region"},
                  ":lambda:path/2015-03-31/functions/",
                  {"Fn::GetAtt": ["ConnectLambda", "Arn"]},
                  "/invocations"
                ]
              ]
            },
            "IntegrationResponses": [
               {
                  "StatusCode": 200
               }
            ]
         },
         "MethodResponses": [
            {
               "StatusCode": 200
            }
         ],
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
                    "DEFAULT_SETTINGS_PARAM":{"Ref":"DefaultQnABotSettings"},
                    "CUSTOM_SETTINGS_PARAM":{"Ref":"CustomQnABotSettings"},
                    "OUTPUT_S3_BUCKET":{"Ref":"ExportBucket"},
                    "KENDRA_ROLE":{"Fn::GetAtt": ["KendraS3Role","Arn"]},
                    "REGION":{"Ref":"AWS::Region"}
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
        // TODO: split the statements up
        "Statement": [{
          "Effect": "Allow",
          "Action": [
              "s3:PutObject",
              "s3:Get*",
              "s3:List*",
              "kendra:CreateFaq",
              "kendra:ListFaqs",
              "kendra:TagResource",
              "kendra:DeleteFaq",
              "kendra:DescribeFaq",
              "iam:passRole",
              "ssm:getParameter"
            ],
            "Resource": [
                {"Fn::Sub":"arn:aws:kendra:${AWS::Region}:${AWS::AccountId}:index/*"},
                {"Fn::Sub":"arn:aws:kendra:${AWS::Region}:${AWS::AccountId}:index/*/faq/*"},
                {"Fn::Sub":"arn:aws:s3:::${ExportBucket}"},
                {"Fn::Sub":"arn:aws:s3:::${ExportBucket}/*"},
                {"Fn::GetAtt": ["KendraS3Role","Arn"]},
                {"Fn::Sub":"arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:*"}
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


