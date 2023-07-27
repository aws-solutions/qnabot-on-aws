/* eslint-disable indent */
/* eslint-disable quotes */
const util = require('../util');

module.exports=Object.assign(
    require('./bucket'),{
    "ImportCodeVersion":{
        "Type": "Custom::S3Version",
        "Properties": {
            "ServiceToken": { "Ref" : "CFNLambda" },
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
                STRIDE:"20000",
                ES_INDEX:{"Ref":"VarIndex"},
                ES_METRICSINDEX:{"Ref":"MetricsIndex"},
                ES_FEEDBACKINDEX:{"Ref":"FeedbackIndex"},
                ES_ENDPOINT:{"Ref":"EsEndpoint"},
                ES_PROXY:{"Ref":"EsProxyLambda"},
                DEFAULT_SETTINGS_PARAM: {Ref: "DefaultQnABotSettings"},
                CUSTOM_SETTINGS_PARAM: {Ref: "CustomQnABotSettings"}
            }
        },
        "Handler": "index.start",
        "MemorySize": "1024",
        "Role": {"Fn::GetAtt": ["ImportRole","Arn"]},
        "Runtime": process.env.npm_package_config_lambdaRuntime,
        "Timeout": 300,
        "VpcConfig" : {
            "Fn::If": [ "VPCEnabled", {
                "SubnetIds": { "Fn::Split" : [ ",", {"Ref": "VPCSubnetIdList"} ] },
                "SecurityGroupIds": { "Fn::Split" : [ ",", {"Ref": "VPCSecurityGroupIdList"} ] },
            }, {"Ref" : "AWS::NoValue"} ]
        },
        "Layers":[
          {"Ref":"AwsSdkLayerLambdaLayer"},
          {"Ref":"CommonModulesLambdaLayer"},
          {"Ref":"EsProxyLambdaLayer"},
          {"Ref":"QnABotCommonLambdaLayer"}
        ],
        "TracingConfig" : {
            "Fn::If": [ "XRAYEnabled", {"Mode": "Active"},
                {"Ref" : "AWS::NoValue"} ]
        },
        "Tags":[{
            Key:"Type",
            Value:"Import"
        }]
      },
      "Metadata": util.cfnNag(["W92"])
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
                ES_INDEX:{"Ref":"VarIndex"},
                ES_METRICSINDEX:{"Ref":"MetricsIndex"},
                ES_FEEDBACKINDEX:{"Ref":"FeedbackIndex"},
                ES_ENDPOINT:{"Ref":"EsEndpoint"},
                ES_PROXY:{"Ref":"EsProxyLambda"},
                DEFAULT_SETTINGS_PARAM: {Ref: "DefaultQnABotSettings"},
                CUSTOM_SETTINGS_PARAM: {Ref: "CustomQnABotSettings"},
                EMBEDDINGS_API: { "Ref": "EmbeddingsApi" },
                EMBEDDINGS_SAGEMAKER_ENDPOINT : { "Ref": "EmbeddingsSagemakerEndpoint" },
                EMBEDDINGS_LAMBDA_ARN: { "Ref": "EmbeddingsLambdaArn" },
            }
        },
        "Handler": "index.step",
        "MemorySize": "1024",
        "Role": {"Fn::GetAtt": ["ImportRole","Arn"]},
        "Runtime": process.env.npm_package_config_lambdaRuntime,
        "Timeout": 900,
        "VpcConfig" : {
            "Fn::If": [ "VPCEnabled", {
                "SubnetIds": { "Fn::Split" : [ ",", {"Ref": "VPCSubnetIdList"} ] },
                "SecurityGroupIds": { "Fn::Split" : [ ",", {"Ref": "VPCSecurityGroupIdList"} ] },
            }, {"Ref" : "AWS::NoValue"} ]
        },
        "Layers":[
          {"Ref":"AwsSdkLayerLambdaLayer"},
          {"Ref":"CommonModulesLambdaLayer"},
          {"Ref":"EsProxyLambdaLayer"},
          {"Ref":"QnABotCommonLambdaLayer"}
        ],
        "TracingConfig" : {
            "Fn::If": [ "XRAYEnabled", {"Mode": "Active"},
                {"Ref" : "AWS::NoValue"} ]
        },
        "Tags":[{
            Key:"Type",
            Value:"Import"
        }]
      },
      "Metadata": util.cfnNag(["W92"])
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
        "Policies": [
          util.basicLambdaExecutionPolicy(),
          util.lambdaVPCAccessExecutionRole(),
          util.xrayDaemonWriteAccess(),
          {
            PolicyName: "SSMGetParameterAccess",
            PolicyDocument: {
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Action: [
                    "ssm:GetParameter",
                  ],
                  Resource: [
                    {"Fn::Join": ["", ["arn:aws:ssm:", {"Ref": "AWS::Region"}, ":", {"Ref": "AWS::AccountId"}, ":parameter/", {"Ref": "CustomQnABotSettings"}]]},
                    {"Fn::Join": ["", ["arn:aws:ssm:", {"Ref": "AWS::Region"}, ":", {"Ref": "AWS::AccountId"}, ":parameter/", {"Ref": "DefaultQnABotSettings"}]]},
                  ],
                }
              ]
            }
          },
          {
            "Fn::If": [
              "EmbeddingsSagemaker",
              {
                "PolicyName" : "SagemakerEmbeddingsPolicy",
                "PolicyDocument" : {
                "Version": "2012-10-17",
                  "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sagemaker:InvokeEndpoint"
                        ],
                        "Resource": {"Ref":"EmbeddingsSagemakerEndpointArn"}
                    }
                  ]
                }
              },
              {"Ref":"AWS::NoValue"}
            ]
          }
        ],
        "ManagedPolicyArns": [
          {"Ref":"ImportPolicy"}
        ]
      },
      "Metadata": util.cfnNag(["W11", "W12"])
    },
    "ImportPolicy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [{
              "Effect": "Allow",
              "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:DeleteObject",
                "s3:DeleteObjectVersion"
              ],
              "Resource":[{"Fn::Sub":"arn:aws:s3:::${ImportBucket}*"}]
          },{
              "Effect": "Allow",
              "Action": [
                "lambda:InvokeFunction"
              ],
              "Resource":[{"Ref":"EsProxyLambda"}, { "Fn::If": ["EmbeddingsLambdaArn", {"Ref":"EmbeddingsLambdaArn"}, {"Ref":"AWS::NoValue"}] }]
          },
          {
              "Effect": "Allow",
              "Action": [
                "es:ESHttpPost",
                "es:ESHttpPut"
              ],
              "Resource": [{"Fn::Join": ["", [{"Ref":"EsArn"}, "/*"]]}]
          }
        ]}
      }
    },
    "ImportClear":{
        "Type": "Custom::S3Clear",
        "Properties": {
            "ServiceToken": { "Ref" : "CFNLambda" },
            "Bucket":{"Ref":"ImportBucket"}
        }
    }
});
