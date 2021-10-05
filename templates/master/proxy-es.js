var _ = require('lodash');
const util = require('../util');

var examples = _.fromPairs(require('../examples/outputs')
  .names
  .map(x => {
    return [x, { "Fn::GetAtt": ["ExamplesStack", `Outputs.${x}`] }];
  }));

module.exports={
    "ESProxyCodeVersion":{
        "Type": "Custom::S3Version",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket": {"Ref":"BootstrapBucket"},
            "Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/proxy-es.zip"},
            "BuildDate":(new Date()).toISOString()
        }
    },

    "UtteranceLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/proxy-es.zip"},
            "S3ObjectVersion":{"Ref":"ESProxyCodeVersion"}
        },
        "Layers":[{"Ref":"AwsSdkLayerLambdaLayer"},
                  {"Ref":"CommonModulesLambdaLayer"},
                  {"Ref":"EsProxyLambdaLayer"},
                  {"Ref":"QnABotCommonLambdaLayer"}],
        "Environment": {
          "Variables": {
            ES_INDEX:{"Fn::GetAtt":["Var","QnaIndex"]},
            ES_ADDRESS:{"Fn::Join" : [ "", [ "https://", {"Fn::GetAtt":["ESVar","ESAddress"]} ] ] },
            UTTERANCE_BUCKET:{"Ref":"AssetBucket"},
            UTTERANCE_KEY:"default-utterances.json",
          }
        },
        "Handler": "index.utterances",
        "MemorySize": "1408",
        "Role": {"Fn::GetAtt": ["ESProxyLambdaRole","Arn"]},
        "Runtime": "nodejs12.x",
        "Timeout": 300,
        "VpcConfig" : {
            "Fn::If": [ "VPCEnabled", {
                "SubnetIds": {"Ref": "VPCSubnetIdList"},
                "SecurityGroupIds": {"Ref": "VPCSecurityGroupIdList"}
            }, {"Ref" : "AWS::NoValue"} ]
        },
        "TracingConfig" : {
            "Fn::If": [ "XRAYEnabled", {"Mode": "Active"},
                {"Ref" : "AWS::NoValue"} ]
        },
        "Tags":[{
            Key:"Type",
            Value:"Service"
        }]
      },
      "Metadata": util.cfnNag(["W92"])
    },
    "ESQidLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/proxy-es.zip"},
            "S3ObjectVersion":{"Ref":"ESProxyCodeVersion"}
        },
        "Layers":[{"Ref":"AwsSdkLayerLambdaLayer"},
                  {"Ref":"CommonModulesLambdaLayer"}, 
                  {"Ref":"EsProxyLambdaLayer"},
                  {"Ref":"QnABotCommonLambdaLayer"}],
        "Environment": {
          "Variables": {
            ES_INDEX:{"Fn::GetAtt":["Var","QnaIndex"]},
            ES_ADDRESS:{"Fn::GetAtt":["ESVar","ESAddress"]}
          }
        },
        "Layers":[{"Ref":"AwsSdkLayerLambdaLayer"},
                  {"Ref":"CommonModulesLambdaLayer"},
                  {"Ref":"EsProxyLambdaLayer"},
                  {"Ref":"QnABotCommonLambdaLayer"}],
        "Handler": "index.qid",
        "MemorySize": "1408",
        "Role": {"Fn::GetAtt": ["ESProxyLambdaRole","Arn"]},
        "Runtime": "nodejs12.x",
        "Timeout": 300,
        "VpcConfig" : {
            "Fn::If": [ "VPCEnabled", {
                "SubnetIds": {"Ref": "VPCSubnetIdList"},
                "SecurityGroupIds": {"Ref": "VPCSecurityGroupIdList"}
            }, {"Ref" : "AWS::NoValue"} ]
        },
        "TracingConfig" : {
            "Fn::If": [ "XRAYEnabled", {"Mode": "Active"},
                {"Ref" : "AWS::NoValue"} ]
        },
        "Tags":[{
            Key:"Type",
            Value:"Service"
        }]
      },
      "Metadata": util.cfnNag(["W92"])
    },
    "ESCleaningLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/proxy-es.zip"},
            "S3ObjectVersion":{"Ref":"ESProxyCodeVersion"}
        },
        "Layers":[{"Ref":"AwsSdkLayerLambdaLayer"},
                  {"Ref":"CommonModulesLambdaLayer"},
                  {"Ref":"EsProxyLambdaLayer"},
                  {"Ref":"QnABotCommonLambdaLayer"}],
        "Environment": {
          "Variables": {
            ES_INDEX:{"Fn::GetAtt":["Var","QnaIndex"]},
            ES_ADDRESS:{"Fn::GetAtt":["ESVar","ESAddress"]},
            FEEDBACK_DELETE_RANGE_MINUTES: {"Ref":"KibanaDashboardRetentionMinutes"},
            METRICS_DELETE_RANGE_MINUTES: {"Ref":"KibanaDashboardRetentionMinutes"},
          }
        },
        "Handler": "index.cleanmetrics",
        "MemorySize": "1408",
        "Role": {"Fn::GetAtt": ["ESProxyLambdaRole","Arn"]},
        "Runtime": "nodejs12.x",
        "Timeout": 300,
        "VpcConfig" : {
            "Fn::If": [ "VPCEnabled", {
                "SubnetIds": {"Ref": "VPCSubnetIdList"},
                "SecurityGroupIds": {"Ref": "VPCSecurityGroupIdList"}
            }, {"Ref" : "AWS::NoValue"} ]
        },
        "TracingConfig" : {
            "Fn::If": [ "XRAYEnabled", {"Mode": "Active"},
                {"Ref" : "AWS::NoValue"} ]
        },
        "Tags":[{
            Key:"Type",
            Value:"Service"
        }]
      },
      "Metadata": util.cfnNag(["W92"])
    },
    "ScheduledESCleaning": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Description": "",
        "ScheduleExpression": "rate(1 day)",
        "State": "ENABLED",
        "Targets": [{
          "Arn": { "Fn::GetAtt": ["ESCleaningLambda", "Arn"] },
          "Id": "ES_Cleaning_Function"
        }]
      }
    },
    "PermissionForEventsToInvokeLambda": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": { "Ref": "ESCleaningLambda" },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": { "Fn::GetAtt": ["ScheduledESCleaning", "Arn"] }
      }
    },
    "ESLoggingLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/proxy-es.zip"},
            "S3ObjectVersion":{"Ref":"ESProxyCodeVersion"}
        },
        "Layers":[{"Ref":"AwsSdkLayerLambdaLayer"},
                  {"Ref":"CommonModulesLambdaLayer"},
                  {"Ref":"EsProxyLambdaLayer"},
                  {"Ref":"QnABotCommonLambdaLayer"}],
        "Environment": {
          "Variables": {
            "FIREHOSE_NAME":{"Ref":"GeneralFirehose"},
          }
        },
        "Handler": "index.logging",
        "MemorySize": "1408",
        "Role": {"Fn::GetAtt": ["ESLoggingLambdaRole","Arn"]},
        "Runtime": "nodejs12.x",
        "Timeout": 300,
        "VpcConfig" : {
            "Fn::If": [ "VPCEnabled", {
                "SubnetIds": {"Ref": "VPCSubnetIdList"},
                "SecurityGroupIds": {"Ref": "VPCSecurityGroupIdList"}
            }, {"Ref" : "AWS::NoValue"} ]
        },
        "TracingConfig" : {
            "Fn::If": [ "XRAYEnabled", {"Mode": "Active"},
                {"Ref" : "AWS::NoValue"} ]
        },
        "Tags":[{
            Key:"Type",
            Value:"Logging"
        }]
      },
      "Metadata": util.cfnNag(["W92"])
    },
    "ESQueryLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/proxy-es.zip"},
            "S3ObjectVersion":{"Ref":"ESProxyCodeVersion"}
        },
        "Environment": {
          "Variables": Object.assign({
              DEFAULT_SETTINGS_PARAM:{"Ref":"DefaultQnABotSettings"},
              CUSTOM_SETTINGS_PARAM:{"Ref":"CustomQnABotSettings"},
          }, examples)
        },
        "Layers":[{"Ref":"AwsSdkLayerLambdaLayer"},
                  {"Ref":"CommonModulesLambdaLayer"},
                  {"Ref":"EsProxyLambdaLayer"},
                  {"Ref":"QnABotCommonLambdaLayer"}],
        "Handler": "index.query",
        "MemorySize": "1408",
        "Role": {"Fn::GetAtt": ["ESProxyLambdaRole","Arn"]},
        "Runtime": "nodejs12.x",
        "Timeout": 300,
        "VpcConfig" : {
            "Fn::If": [ "VPCEnabled", {
                "SubnetIds": {"Ref": "VPCSubnetIdList"},
                "SecurityGroupIds": {"Ref": "VPCSecurityGroupIdList"}
            }, {"Ref" : "AWS::NoValue"} ]
        },
        "TracingConfig" : {
            "Fn::If": [ "XRAYEnabled", {"Mode": "Active"},
                {"Ref" : "AWS::NoValue"} ]
        },
        "Tags":[{
            Key:"Type",
            Value:"Query"
        }]
      },
      "Metadata": util.cfnNag(["W92"])
    },
    "ESProxyLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/proxy-es.zip"},
            "S3ObjectVersion":{"Ref":"ESProxyCodeVersion"}
        },
        "Layers":[{"Ref":"AwsSdkLayerLambdaLayer"},
                  {"Ref":"CommonModulesLambdaLayer"},
                  {"Ref":"EsProxyLambdaLayer"},
                  {"Ref":"QnABotCommonLambdaLayer"},
                ],
        "Environment": {
          "Variables": {
            ES_TYPE:{"Fn::GetAtt":["Var","QnAType"]},
            ES_INDEX:{"Fn::GetAtt":["Var","QnaIndex"]},
            ES_ADDRESS:{"Fn::GetAtt":["ESVar","ESAddress"]},
            DEFAULT_SETTINGS_PARAM:{"Ref":"DefaultQnABotSettings"},
            CUSTOM_SETTINGS_PARAM:{"Ref":"CustomQnABotSettings"},
          }
        },
        "Handler": "index.handler",
        "MemorySize": "1408",
        "Role": {"Fn::GetAtt": ["ESProxyLambdaRole","Arn"]},
        "Runtime": "nodejs12.x",
        "Timeout": 300,
        "VpcConfig" : {
            "Fn::If": [ "VPCEnabled", {
                "SubnetIds": {"Ref": "VPCSubnetIdList"},
                "SecurityGroupIds": {"Ref": "VPCSecurityGroupIdList"}
            }, {"Ref" : "AWS::NoValue"} ]
        },
        "TracingConfig" : {
            "Fn::If": [ "XRAYEnabled", {"Mode": "Active"},
                {"Ref" : "AWS::NoValue"} ]
        },
        "Tags":[{
            Key:"Type",
            Value:"Service"
        }]
      },
      "Metadata": util.cfnNag(["W92"])
    },
    "ESProxyLambdaRole": {
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
          {"Ref":"QueryPolicy"},
        ],
        "Policies": [
          util.basicLambdaExecutionPolicy(),
          util.lambdaVPCAccessExecutionRole(),
          util.xrayDaemonWriteAccess(),
          util.translateReadOnly(),
          util.lexFullAccess(),
          {
          	"PolicyName": "ParamStorePolicy",
          	"PolicyDocument": {
          		"Version": "2012-10-17",
          		"Statement": [{
          			"Effect": "Allow",
          			"Action": ["ssm:GetParameter","ssm:GetParameters"],
          			"Resource": "*"
          		}]
          	}
          },
          {
            "PolicyName" : "S3QNABucketReadAccess",
            "PolicyDocument" : {
            "Version": "2012-10-17",
              "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject"
                     ],
                    "Resource": [
                        "arn:aws:s3:::QNA*/*",
                        "arn:aws:s3:::qna*/*"
                    ]
                }
              ]
            }
          }
        ]
      },
      "Metadata": util.cfnNag(["W11", "W12", "W76", "F3"])
    },
    "QueryLambdaInvokePolicy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
          "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [{
                  "Effect": "Allow",
                  "Action": ["lambda:InvokeFunction"],
                  "Resource": [
                      "arn:aws:lambda:*:*:function:qna*",
                      "arn:aws:lambda:*:*:function:QNA*"
                  ].concat(require('../examples/outputs').names
                    .map(x => {
                      return { "Fn::GetAtt": ["ExamplesStack", `Outputs.${x}`] };
                    }))
              }]
          },
        "Roles": [{ "Ref": "ESProxyLambdaRole" }]
      }
    },
    "ESLoggingLambdaRole": {
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
        "Policies":[
          util.basicLambdaExecutionPolicy(),
          util.lambdaVPCAccessExecutionRole(),
          util.xrayDaemonWriteAccess(),
          {
          "PolicyName" : "LambdaGeneralFirehoseQNALambda",
          "PolicyDocument" : {
          "Version": "2012-10-17",
            "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "lambda:InvokeFunction"
                  ],
                  "Resource": [
                    {"Fn::Join": ["",["arn:aws:lambda:",{ "Ref" : "AWS::Region" },":",{ "Ref" : "AWS::AccountId" },":function:qna-*"]]},
                    {"Fn::Join": ["",["arn:aws:lambda:",{ "Ref" : "AWS::Region" },":",{ "Ref" : "AWS::AccountId" },":function:QNA-*"]]},
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "firehose:PutRecord",
                    "firehose:PutRecordBatch"
                  ],
                  "Resource": [
                    {"Fn::GetAtt" : ["GeneralFirehose", "Arn"]}
                  ]
                }
            ]
          }
        }],
      },
      "Metadata": util.cfnNag(["W11", "W12"])
    },
    "QueryPolicy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "es:*"
              ],
              "Resource":["*"]
            },{
              "Effect": "Allow",
              "Action": [
                "kendra:Query"
              ],
              "Resource":[
                {"Fn::Sub":"arn:aws:kendra:${AWS::Region}:${AWS::AccountId}:index/*"},
              ]
            },{
                "Effect": "Allow",
                "Action": ["s3:Get*"],
                "Resource":[
                    {"Fn::Sub":"arn:aws:s3:::${AssetBucket}*"}
                ]
            },
            {
              "Effect": "Allow",
              "Action": ["comprehend:DetectSyntax"],
              "Resource":["*"]
            }
          ]
        }
      },
      "Metadata": util.cfnNag(["F5", "W13"])
    }
}

