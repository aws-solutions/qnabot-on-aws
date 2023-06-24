// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const _ = require('lodash');
const util = require('../../util');

const examples = _.fromPairs(require('../../examples/outputs')
  .names
  .map(x => {
    return [x, { "Fn::GetAtt": ["ExamplesStack", `Outputs.${x}`] }]
  }))
const responsebots = _.fromPairs(require('../../examples/examples/responsebots-lexv2')
  .names
  .map(x => {
    return [x, { "Fn::GetAtt": ["ExamplesStack", `Outputs.${x}`] }]
  }))

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
  "LangchainTestLambda": {
    "Type": "AWS::Lambda::Function",
    "DependsOn": "FulfillmentCodeVersion",
    "Properties": {
      "Code": {
        "S3Bucket": {"Ref": "BootstrapBucket"},
        "S3Key": {"Fn::Sub": "${BootstrapPrefix}/lambda/fulfillment.zip"},
        "S3ObjectVersion": {"Ref": "FulfillmentCodeVersion"}
      },
      "Handler": "langchaintest.handler",
      "Layers":[
        {"Ref":"AwsSdkLayerLambdaLayer"},
        {"Ref":"CommonModulesLambdaLayer"},
        {"Ref":"EsProxyLambdaLayer"},
        {"Ref":"QnABotCommonLambdaLayer"}
      ],
      "MemorySize": 1408,
      "Role": {"Fn::GetAtt": ["FulfillmentLambdaRole", "Arn"]},
      "Runtime": "nodejs18.x",
      "Timeout": 300,
      "TracingConfig": {
        "Mode": {
          "Fn::If": [
            "XRAYEnabled",
            "Active",
            "PassThrough"
          ]
        }
      },
      "Tags": [
        {
          "Key": "Type",
          "Value": "Fulfillment"
        }
      ],
      "VpcConfig" : {
        "Fn::If": [
          "VPCEnabled",
          {
            "SubnetIds": {"Ref": "VPCSubnetIdList"},
            "SecurityGroupIds": {"Ref": "VPCSecurityGroupIdList"}
          },
          {"Ref" : "AWS::NoValue"}
        ]
      }
    },
    "Metadata": util.cfnNag(["W89", "W92"])
  },
  "FulfillmentLambda": {
    "Type": "AWS::Lambda::Function",
    "DependsOn": "FulfillmentCodeVersion",
    "Properties": {
      "Code": {
        "S3Bucket": {"Ref": "BootstrapBucket"},
        "S3Key": {"Fn::Sub": "${BootstrapPrefix}/lambda/fulfillment.zip"},
        "S3ObjectVersion": {"Ref": "FulfillmentCodeVersion"}
      },
      //Note: updates to this lambda function do not automatically generate a new version
      //if making changes here, be sure to update FulfillmentLambdaVersionGenerator as appropriate
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
          ALIAS_SETTINGS_PARAM: { "Fn::GetAtt": ["ExamplesStack", "Outputs.AliasSettings"] },
          EMBEDDINGS_API: { "Ref": "EmbeddingsApi" },
          EMBEDDINGS_SAGEMAKER_ENDPOINT : {
            "Fn::If": [
                "EmbeddingsSagemaker",
                {"Fn::GetAtt": ["SagemakerEmbeddingsStack", "Outputs.EmbeddingsSagemakerEndpoint"] },
                ""
            ]
          },
          EMBEDDINGS_SAGEMAKER_INSTANCECOUNT : { "Ref": "SagemakerInitialInstanceCount" },
          EMBEDDINGS_LAMBDA_ARN: { "Ref": "EmbeddingsLambdaArn" },
          BEDROCK_EMBEDDINGS_LAMBDA_ARN: {
            "Fn::If": [
                "EmbeddingsBedrock", 
                {"Fn::GetAtt": ["BedrockStack", "Outputs.BedrockEmbeddingsLambdaArn"] }, 
                ""
            ]
          },
          KENDRA_RETRIEVAL_LAMBDA_ARN: {"Fn::GetAtt": ["KendraRetrievalStack", "Outputs.KendraRetrieveLambdaArn"] },
          LLM_API: { "Ref": "LLMApi" },
          LLM_SAGEMAKERENDPOINT : {
            "Fn::If": [
                "LLMSagemaker", 
                {"Fn::GetAtt": ["SageMakerQASummarizeLLMStack", "Outputs.LLMSagemakerEndpoint"] }, 
                ""
            ]
          },
          LLM_SAGEMAKERINSTANCECOUNT : { "Ref": "LLMSagemakerInitialInstanceCount" }, // force new fn version when instance count changes
          LLM_LAMBDA_ARN: { "Ref": "LLMLambdaArn" },
          BEDROCK_LLM_LAMBDA_ARN : {
            "Fn::If": [
                "LLMBedrock", 
                {"Fn::GetAtt": ["BedrockStack", "Outputs.BedrockLLMLambdaArn"] }, 
                ""
            ]
          },
        })
      },
      "Handler": "index.handler",
      "Layers":[
        {"Ref":"AwsSdkLayerLambdaLayer"},
        {"Ref":"CommonModulesLambdaLayer"},
        {"Ref":"EsProxyLambdaLayer"},
        {"Ref":"QnABotCommonLambdaLayer"}
      ],
      "MemorySize": 1408,
      "Role": {"Fn::GetAtt": ["FulfillmentLambdaRole", "Arn"]},
      "Runtime": "nodejs18.x",
      "Timeout": 300,
      "TracingConfig": {
        "Mode": {
          "Fn::If": [
            "XRAYEnabled",
            "Active",
            "PassThrough"
          ]
        }
      },
      "Tags": [
        {
          "Key": "Type",
          "Value": "Fulfillment"
        }
      ],
      "VpcConfig" : {
        "Fn::If": [
          "VPCEnabled",
          {
            "SubnetIds": {"Ref": "VPCSubnetIdList"},
            "SecurityGroupIds": {"Ref": "VPCSecurityGroupIdList"}
          },
          {"Ref" : "AWS::NoValue"}
        ]
      }
    },
    "Metadata": util.cfnNag(["W89", "W92"])
  },
  "FulfillmentLambdaVersionGenerator": {
    "Type": "Custom::LambdaVersion",
    //this custom resource takes no action on deletes as we keep all versions
    //the lambda versions will be deleted along with it's parent Lambda Function
    //setting DeletionPolicy of Retain to prevent CFNLambda failures on rollbacks to old versions
    "DeletionPolicy" : "Retain",
    "Properties": {
      "ServiceToken": { "Fn::GetAtt": ["CFNLambda", "Arn"] },
      "FunctionName": {"Ref": "FulfillmentLambda"},
      "Triggers": { //The set of triggers to kick off a Custom Resource Update event
        "FulfillmentCodeVersionTrigger": [
          {"Ref": "FulfillmentCodeVersion"}
        ],
        "LayersTrigger": [
          {"Ref": "AwsSdkLayerLambdaLayer"},
          {"Ref": "CommonModulesLambdaLayer"},
          {"Ref": "EsProxyLambdaLayer"},
          {"Ref": "QnABotCommonLambdaLayer"}
        ],
        "EmbeddingsTrigger": [
          {"Ref": "EmbeddingsApi"},
          {"Ref": "SagemakerInitialInstanceCount"},
          {"Fn::If": [
              "EmbeddingsSagemaker",
              {"Fn::GetAtt": ["SagemakerEmbeddingsStack", "Outputs.EmbeddingsSagemakerEndpoint"]},
              ""
          ]},
          {"Ref": "EmbeddingsLambdaArn"},
          {"Fn::If": [
            "EmbeddingsBedrock",
            {"Fn::GetAtt": ["BedrockStack", "Outputs.BedrockEmbeddingsLambdaArn"]},
            ""
          ]},          
        ],
        "QASummarizeTrigger": [
          {"Ref": "LLMApi"},
          {"Ref": "SagemakerInitialInstanceCount"},
          {"Fn::If": [
                "LLMSagemaker", 
                {"Fn::GetAtt": ["SageMakerQASummarizeLLMStack", "Outputs.LLMSagemakerEndpoint"] }, 
                ""
          ]},
          {"Ref": "LLMLambdaArn"}
        ]
      }
    }
  },
  "FulfillmentLambdaAliaslive": {
    "Type": "AWS::Lambda::Alias",
    "DependsOn": "FulfillmentLambdaVersionGenerator",
    "Properties": {
      "FunctionName": {"Ref": "FulfillmentLambda"},
      "FunctionVersion": {"Fn::GetAtt": ["FulfillmentLambdaVersionGenerator", "Version"]},
      "Name": "live",
      "ProvisionedConcurrencyConfig": {
        "Fn::If": [
          "CreateConcurrency",
          {"ProvisionedConcurrentExecutions": {"Ref": "FulfillmentConcurrency"}},
          {"Ref" : "AWS::NoValue"}
        ]
      },
    }
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
            { "Fn::If": ["EmbeddingsLambdaArn", {"Ref":"EmbeddingsLambdaArn"}, {"Ref":"AWS::NoValue"}] },
            { "Fn::If": ["EmbeddingsBedrock", {"Fn::GetAtt": ["BedrockStack", "Outputs.BedrockEmbeddingsLambdaArn"]}, {"Ref":"AWS::NoValue"}] },
            { "Fn::GetAtt": ["KendraRetrievalStack", "Outputs.KendraRetrieveLambdaArn"] },
            { "Fn::If": ["LLMLambdaArn", {"Ref":"LLMLambdaArn"}, {"Ref":"AWS::NoValue"}] },
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
          "Fn::If": [
            "EmbeddingsSagemaker",
            {
              "PolicyName" : "EmbeddingsSagemakerInvokeEndpointAccess",
              "PolicyDocument" : {
              "Version": "2012-10-17",
                "Statement": [
                  {
                    "Effect": "Allow",
                    "Action": [
                        "sagemaker:InvokeEndpoint"
                    ],
                    "Resource": {"Fn::GetAtt": ["SagemakerEmbeddingsStack", "Outputs.EmbeddingsSagemakerEndpointArn"]}
                  }
                ]
              }
            },
            {"Ref":"AWS::NoValue"}
          ]
        },
        { 
          "Fn::If": [
            "LLMSagemaker", 
            {
              "PolicyName" : "LLMSagemakerInvokeEndpointAccess",
              "PolicyDocument" : {
              "Version": "2012-10-17",
                "Statement": [
                  { 
                    "Effect": "Allow",
                    "Action": [
                        "sagemaker:InvokeEndpoint"
                    ],
                    "Resource": {"Fn::GetAtt": ["SageMakerQASummarizeLLMStack", "Outputs.LLMSagemakerEndpointArn"]}
                  }
                ]
              }
            },
            {"Ref":"AWS::NoValue"}
          ]
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
          TARGET_PATH: "_search",
          TARGET_INDEX: { "Fn::GetAtt": ["Var","QnaIndex"] },
          TARGET_URL: { "Fn::GetAtt": ["ESVar", "ESAddress"] },
          DEFAULT_SETTINGS_PARAM: { "Ref": "DefaultQnABotSettings" },
          CUSTOM_SETTINGS_PARAM: { "Ref": "CustomQnABotSettings" },
        })
      },
      "Handler": "index.warmer",
      "MemorySize": "512",
      "Role": { "Fn::GetAtt": ["WarmerLambdaRole", "Arn"] },
      "Runtime": "nodejs16.x",
      "Timeout": 300,
      "Layers": [
        {"Ref": "AwsSdkLayerLambdaLayer"},
        {"Ref": "CommonModulesLambdaLayer"},
        {"Ref": "EsProxyLambdaLayer"},
        {"Ref":"QnABotCommonLambdaLayer"}
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
