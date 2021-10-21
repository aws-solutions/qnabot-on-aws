var config = require('./config');
var _ = require('lodash');
var crypto = require('crypto')
var fs = require('fs')
const util = require('../../util');

var examples = _.fromPairs(require('../../examples/outputs')
  .names
  .map(x => {
    return [x, { "Fn::GetAtt": ["ExamplesStack", `Outputs.${x}`] }]
  }))
var responsebots = _.fromPairs(require('../../examples/examples/responsebots-lexv2')
  .names
  .map(x => {
    return [x, { "Fn::GetAtt": ["ExamplesStack", `Outputs.${x}`] }]
  }))

const filesToHash = ['fulfillment.zip', 'es-proxy-layer.zip','common-modules-layer.zip','aws-sdk-layer.zip','qnabot-common-layer.zip']
const comboHash = filesToHash.map(x => {
    let filePath = (fs.existsSync("../../build/lambda/" + x) ? "../../" : "./") + "build/lambda/" + x
    let fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(fileBuffer).digest("hex")
  }).reduce((a,b) => {
    return a + b;
  });
const fulfillmentHash =  crypto.createHash("sha256").update(comboHash).digest("hex")

module.exports = {
  "Alexa": {
    "Type": "AWS::Lambda::Permission",
    "DependsOn": "FulfillmentLambdaAliaslive",
    "Properties": {
      "Action": "lambda:InvokeFunction",
      "FunctionName": {  "Fn::Join": [ ":", [
        {"Fn::GetAtt":["FulfillmentLambda","Arn"]},
        "live"
      ]]},
      "Principal": "alexa-appkit.amazon.com"
    }
  },
  "FulfillmentCodeVersion": {
    "Type": "Custom::S3Version",
    "Properties": {
      "ServiceToken": { "Fn::GetAtt": ["CFNLambda", "Arn"] },
      "Bucket": { "Ref": "BootstrapBucket" },
      "Key": { "Fn::Sub": "${BootstrapPrefix}/lambda/fulfillment.zip" },
      "BuildDate": (new Date()).toISOString()
    }
  },
  "FulfillmentLambda": {
    "Type": "AWS::Serverless::Function",
    "DependsOn": "FulfillmentCodeVersion",
    "Properties": {
      "AutoPublishAlias":"live",
      "AutoPublishCodeSha256": fulfillmentHash,
      "CodeUri": {
        "Bucket": { "Ref": "BootstrapBucket" },
        "Key": { "Fn::Sub": "${BootstrapPrefix}/lambda/fulfillment.zip" },
        "Version": { "Ref": "FulfillmentCodeVersion" }
      },
      "Environment": {
        "Variables": Object.assign({
          ES_TYPE: { "Fn::GetAtt": ["Var", "QnAType"] },
          ES_INDEX: { "Fn::GetAtt": ["Var","QnaIndex"] },
          ES_ADDRESS: { "Fn::GetAtt": ["ESVar", "ESAddress"] },
          LAMBDA_DEFAULT_QUERY: { "Ref": "ESQueryLambda" },
          LAMBDA_LOG: { "Ref": "ESLoggingLambda" },
          ES_SERVICE_QID: { "Ref": "ESQidLambda" },
          ES_SERVICE_PROXY: { "Ref": "ESProxyLambda" },
          DYNAMODB_USERSTABLE: { "Ref": "UsersTable" },
          DEFAULT_USER_POOL_JWKS_PARAM: { "Ref": "DefaultUserPoolJwksUrl" },
          DEFAULT_SETTINGS_PARAM: { "Ref": "DefaultQnABotSettings" },
          CUSTOM_SETTINGS_PARAM: { "Ref": "CustomQnABotSettings" },
        }, examples, responsebots)
      },
      "Handler": "index.handler",
      "MemorySize": 1408,
      "ProvisionedConcurrencyConfig": {
        "Fn::If": [ "CreateConcurrency", {
          "ProvisionedConcurrentExecutions" : {"Ref": "FulfillmentConcurrency"}
        }, {"Ref" : "AWS::NoValue"} ]
      },
      "Role": { "Fn::GetAtt": ["FulfillmentLambdaRole", "Arn"] },
      "Runtime": "nodejs12.x",
      "Timeout": 300,
      "VpcConfig" : {
        "Fn::If": [ "VPCEnabled", {
          "SubnetIds": {"Ref": "VPCSubnetIdList"},
          "SecurityGroupIds": {"Ref": "VPCSecurityGroupIdList"}
        }, {"Ref" : "AWS::NoValue"} ]
      },
      "Tracing" : {
        "Fn::If": [ "XRAYEnabled", "Active",
          "PassThrough" ]
      },
      "Layers":[{"Ref":"AwsSdkLayerLambdaLayer"},
                {"Ref":"CommonModulesLambdaLayer"},
                {"Ref":"EsProxyLambdaLayer"},
                {"Ref":"QnABotCommonLambdaLayer"}],
      "Tags": {
        "Type": "Fulfillment"
      }
    },
    "Metadata": util.cfnNag(["W89", "W92"])
  },
  "InvokePolicy": {
    "Type": "AWS::IAM::ManagedPolicy",
    "Properties": {
      "PolicyDocument": {
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "lambda:InvokeFunction"
          ],
          "Resource": [
            "arn:aws:lambda:*:*:function:qna-*",
            "arn:aws:lambda:*:*:function:QNA-*",
            { "Fn::GetAtt": ["ESQueryLambda", "Arn"] },
            { "Fn::GetAtt": ["ESProxyLambda", "Arn"] },
            { "Fn::GetAtt": ["ESLoggingLambda", "Arn"] },
            { "Fn::GetAtt": ["ESQidLambda", "Arn"] },
          ].concat(require('../../examples/outputs').names
            .map(x => {
              return { "Fn::GetAtt": ["ExamplesStack", `Outputs.${x}`] }
            }))
        }]
      },
      "Roles": [{ "Ref": "FulfillmentLambdaRole" }]
    }
  },
  "LexBotPolicy": {
    "Type": "AWS::IAM::ManagedPolicy",
    "Properties": {
      "PolicyDocument": {
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "lex:PostText",
            "lex:RecognizeText"
          ],
          "Resource": [
            "arn:aws:lex:*:*:bot:QNA*",
            "arn:aws:lex:*:*:bot*",
          ]
        }]
      },
      "Roles": [{ "Ref": "FulfillmentLambdaRole" }]
    }
  },
  "FulfillmentLambdaRole": {
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
        { "Ref": "QueryPolicy" }
      ],
      "Policies": [
        util.basicLambdaExecutionPolicy(),
        util.lambdaVPCAccessExecutionRole(),
        util.xrayDaemonWriteAccess(),
        util.translateReadOnly(),
        util.comprehendReadOnly(),
        {
          "PolicyName": "ParamStorePolicy",
          "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [{
              "Effect": "Allow",
              "Action": [
                "ssm:GetParameter",
                "ssm:GetParameters"
              ],
              "Resource": [
                {
                  "Fn::Join": [
                    "", [
                      "arn:aws:ssm:",
                      { "Fn::Sub": "${AWS::Region}:" },
                      { "Fn::Sub": "${AWS::AccountId}:" },
                      "parameter/",
                      { "Ref": "DefaultQnABotSettings" }
                    ]
                  ]
                },
                {
                  "Fn::Join": [
                    "", [
                      "arn:aws:ssm:",
                      { "Fn::Sub": "${AWS::Region}:" },
                      { "Fn::Sub": "${AWS::AccountId}:" },
                      "parameter/",
                      { "Ref": "CustomQnABotSettings" }
                    ]
                  ]
                },
                {
                  "Fn::Join": [
                    "", [
                      "arn:aws:ssm:",
                      { "Fn::Sub": "${AWS::Region}:" },
                      { "Fn::Sub": "${AWS::AccountId}:" },
                      "parameter/",
                      { "Ref": "DefaultUserPoolJwksUrl" }
                    ]
                  ]
                }
              ]
            }]
          }
        },
        {
          "PolicyName": "DynamoDBPolicy",
          "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [{
              "Effect": "Allow",
              "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
              ],
              "Resource": [
                { "Fn::GetAtt": ["UsersTable", "Arn"] }
              ]
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
    "Metadata": util.cfnNag(["W11", "W12"])
  },
  "ESWarmerLambda": {
    "Type": "AWS::Lambda::Function",
    "Properties": {
      "Code": {
        "S3Bucket": { "Ref": "BootstrapBucket" },
        "S3Key": { "Fn::Sub": "${BootstrapPrefix}/lambda/fulfillment.zip" },
        "S3ObjectVersion": { "Ref": "FulfillmentCodeVersion" }
      },
      "Environment": {
        "Variables": Object.assign({
          REPEAT_COUNT:  "4",
          TARGET_PATH: "_doc/_search",
          TARGET_INDEX: { "Fn::GetAtt": ["Var","QnaIndex"] },
          TARGET_URL: { "Fn::GetAtt": ["ESVar", "ESAddress"] },
          DEFAULT_SETTINGS_PARAM: { "Ref": "DefaultQnABotSettings" },
          CUSTOM_SETTINGS_PARAM: { "Ref": "CustomQnABotSettings" },
        })
      },
      "Handler": "index.warmer",
      "MemorySize": "512",
      "Role": { "Fn::GetAtt": ["WarmerLambdaRole", "Arn"] },
      "Runtime": "nodejs12.x",
      "Timeout": 300,
      "Layers": [
        {"Ref": "AwsSdkLayerLambdaLayer"},
        {"Ref": "CommonModulesLambdaLayer"},
        {"Ref": "EsProxyLambdaLayer"}
      ],
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
      "Tags": [{
        Key: "Type",
        Value: "Warmer"
      }]
    },
    "Metadata": util.cfnNag(["W92"])
  },
  "WarmerLambdaRole": {
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
      "Policies": [
        util.basicLambdaExecutionPolicy(),
        util.lambdaVPCAccessExecutionRole(),
        util.xrayDaemonWriteAccess(),
        {
          "PolicyName": "ParamStorePolicy",
          "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [{
              "Effect": "Allow",
              "Action": [
                "ssm:GetParameter",
                "ssm:GetParameters"
              ],
              "Resource": [
                {
                  "Fn::Join": [
                    "", [
                      "arn:aws:ssm:",
                      { "Fn::Sub": "${AWS::Region}:" },
                      { "Fn::Sub": "${AWS::AccountId}:" },
                      "parameter/",
                      { "Ref": "DefaultQnABotSettings" }
                    ]
                  ]
                },
                {
                  "Fn::Join": [
                    "", [
                      "arn:aws:ssm:",
                      { "Fn::Sub": "${AWS::Region}:" },
                      { "Fn::Sub": "${AWS::AccountId}:" },
                      "parameter/",
                      { "Ref": "CustomQnABotSettings" }
                    ]
                  ]
                }
              ]
            },
              {
              "Sid": "AllowES",
              "Effect": "Allow",
              "Action": [
                "es:ESHttpGet",
              ],
              "Resource": [
                "*"
              ]
            }]
          }
        }
      ]
    },
    "Metadata": util.cfnNag(["W11", "W12"])
  },
  "ESWarmerRule": {
    "Type": "AWS::Events::Rule",
    "Properties": {
      "ScheduleExpression": "rate(1 minute)",
      "Targets": [
        {
          "Id": "ESWarmerScheduler",
          "Arn": {
            "Fn::GetAtt": [
              "ESWarmerLambda",
              "Arn"
            ]
          }
        }
      ]
    }
  },
  "ESWarmerRuleInvokeLambdaPermission": {
    "Type": "AWS::Lambda::Permission",
    "Properties": {
      "FunctionName": {
        "Fn::GetAtt": [
          "ESWarmerLambda",
          "Arn"
        ]
      },
      "Action": "lambda:InvokeFunction",
      "Principal": "events.amazonaws.com",
      "SourceArn": {
        "Fn::GetAtt": [
          "ESWarmerRule",
          "Arn"
        ]
      }
    }
  }
}
