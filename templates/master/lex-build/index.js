var fs = require('fs');
var _ = require('lodash');
const util = require('../../util');

module.exports = {
  "LexBuildLambda": lambda({
    "S3Bucket": { "Ref": "BootstrapBucket" },
    "S3Key": { "Fn::Sub": "${BootstrapPrefix}/lambda/lex-build.zip" },
    "S3ObjectVersion": { "Ref": "LexBuildCodeVersion" }
  }, {
    UTTERANCE_BUCKET: { "Ref": "AssetBucket" },
    UTTERANCE_KEY: "default-utterances.json",
    POLL_LAMBDA: { "Fn::GetAtt": ["LexBuildLambdaPoll", "Arn"] },
    STATUS_BUCKET: { "Ref": "BuildStatusBucket" },
    STATUS_KEY: { "Fn::If": ["CreateLexV1Bots", "status.json", { "Ref": "AWS::NoValue" }] },
    LEXV2_STATUS_KEY: "lexV2status.json",
    BOTNAME: { "Fn::If": ["CreateLexV1Bots", { "Ref": "LexBot" }, { "Ref": "AWS::NoValue" }] },
    BOTALIAS: { "Fn::If": ["CreateLexV1Bots", { "Ref": "VersionAlias" }, { "Ref": "AWS::NoValue" }] },
    SLOTTYPE: { "Fn::If": ["CreateLexV1Bots", { "Ref": "SlotType" }, { "Ref": "AWS::NoValue" }] },
    INTENT: { "Fn::If": ["CreateLexV1Bots", { "Ref": "Intent" }, { "Ref": "AWS::NoValue" }] },
    INTENTFALLBACK: { "Fn::If": ["CreateLexV1Bots", { "Ref": "IntentFallback" }, { "Ref": "AWS::NoValue" }] },
    LEXV2_BUILD_LAMBDA: { "Ref": "Lexv2BotLambda" },
    ADDRESS: { "Fn::Join": ["", ["https://", { "Fn::GetAtt": ["ESVar", "ESAddress"] }]] },
    INDEX: { "Fn::GetAtt": ["Var", "index"] },
  }, "nodejs12.x"),
  "LexBuildLambdaStart": lambda({
    "ZipFile": fs.readFileSync(__dirname + '/start.js', 'utf8')
  }, {
    STATUS_BUCKET: { "Ref": "BuildStatusBucket" },
    STATUS_KEY: { "Fn::If": ["CreateLexV1Bots", "status.json", { "Ref": "AWS::NoValue" }] },
    LEXV2_STATUS_KEY: "lexV2status.json",
    BUILD_FUNCTION: { "Fn::GetAtt": ["LexBuildLambda", "Arn"] }
  }),
  "LexBuildLambdaPoll": lambda({
    "ZipFile": fs.readFileSync(__dirname + '/poll.js', 'utf8')
  }, {
    STATUS_KEY: { "Fn::If": ["CreateLexV1Bots", "status.json", { "Ref": "AWS::NoValue" }] },
    STATUS_BUCKET: { "Ref": "BuildStatusBucket" },
    BOT_NAME: { "Fn::If": ["CreateLexV1Bots", { "Ref": "LexBot" }, { "Ref": "AWS::NoValue" }] },
  }),
  "LexBuildCodeVersion": {
    "Type": "Custom::S3Version",
    "Properties": {
      "ServiceToken": { "Fn::GetAtt": ["CFNLambda", "Arn"] },
      "Bucket": { "Ref": "BootstrapBucket" },
      "Key": { "Fn::Sub": "${BootstrapPrefix}/lambda/lex-build.zip" },
      "BuildDate": (new Date()).toISOString()
    }
  },
  "LexBuildInvokePolicy": {
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
            { "Fn::GetAtt": ["LexBuildLambda", "Arn"] },
            { "Fn::GetAtt": ["LexBuildLambdaPoll", "Arn"] },
            { "Fn::GetAtt": ["Lexv2BotLambda", "Arn"] }
          ]
        }]
      },
      "Roles": [{ "Ref": "LexBuildLambdaRole" }]
    }
  },
  "LexBuildLambdaRole": {
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
      "Policies": [
        util.basicLambdaExecutionPolicy(),
        util.lambdaVPCAccessExecutionRole(),
        util.xrayDaemonWriteAccess(),
        util.lexFullAccess(),
        {
        PolicyName: "AssetBucketAccess",
        PolicyDocument: {
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Allow",
            "Action": ["s3:Get*"],
            "Resource": [
              { "Fn::Sub": "arn:aws:s3:::${AssetBucket}*" },
              { "Fn::Sub": "arn:aws:s3:::${BuildStatusBucket}*" }
            ]
          }, {
            "Effect": "Allow",
            "Action": ["s3:Put*"],
            "Resource": [
              { "Fn::Sub": "arn:aws:s3:::${BuildStatusBucket}*" }
            ]
          }]
        }
      }],
      "Path": "/",
      "ManagedPolicyArns": [
        { "Ref": "QueryPolicy" },
      ]
    },
    "Metadata": util.cfnNag(["W11", "W12", "W76", "F3"])
  },
  "BuildStatusBucket": {
    "Type": "AWS::S3::Bucket",
    "Properties": {
      "LifecycleConfiguration": {
        "Rules": [{
          "NoncurrentVersionExpirationInDays": 1,
          "Status": "Enabled"
        }, {
          "AbortIncompleteMultipartUpload": {
            "DaysAfterInitiation": 1
          },
          "Status": "Enabled"
        }]
      },
      "VersioningConfiguration": {
        "Status": "Enabled"
      },
      "PublicAccessBlockConfiguration": {
        "BlockPublicAcls": true,
        "BlockPublicPolicy": true,
        "IgnorePublicAcls": true,
        "RestrictPublicBuckets": true
      },
      "BucketEncryption": {
        "Fn::If": [
          "Encrypted",
          {
            "ServerSideEncryptionConfiguration": [{
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }]
          },
          {
            "Ref": "AWS::NoValue"
          }
        ]
      }
    },
    "Metadata": util.cfnNag(["W35"])
  },
  "HTTPSOnlyBuildStatusBucketPolicy": {
    "Type": "AWS::S3::BucketPolicy",
    "Properties": {
      "Bucket": {
        "Ref": "BuildStatusBucket"
      },
      "PolicyDocument": {
        "Statement": [
          {
            "Action": "*",
            "Condition": {
              "Bool": {
                "aws:SecureTransport": "false"
              }
            },
            "Effect": "Deny",
            "Principal": "*",
            "Resource": {
              "Fn::Join": [
                "",
                [
                  {
                    "Fn::GetAtt": [
                      "BuildStatusBucket",
                      "Arn"
                    ]
                  },
                  "/*"
                ]
              ]
            },
            "Sid": "HttpsOnly"
          }
        ],
        "Version": "2012-10-17"
      }
    },
    "Metadata": {
      "aws:cdk:path": "serverless-bot-framework/CloudfrontStaticWebsite/CloudFrontToS3/S3LoggingBucket/Policy/Resource"
    }
  },
  "BuildStatusClear": {
    "Type": "Custom::S3Clear",
    "DependsOn": ["CFNInvokePolicy"],
    "Properties": {
      "ServiceToken": { "Fn::GetAtt": ["CFNLambda", "Arn"] },
      "Bucket": { "Ref": "BuildStatusBucket" }
    }
  }
};

function lambda(code, variable = {}, runtime = "nodejs12.x") {
  return {
    "Type": "AWS::Lambda::Function",
    "Properties": {
      "Code": code,
      "Environment": {
        "Variables": variable
      },
      "Handler": "index.handler",
      "MemorySize": "1024",
      "Role": { "Fn::GetAtt": ["LexBuildLambdaRole", "Arn"] },
      "Runtime": runtime,
      "Timeout": 900,
      "VpcConfig": {
        "Fn::If": ["VPCEnabled", {
          "SubnetIds": { "Ref": "VPCSubnetIdList" },
          "SecurityGroupIds": { "Ref": "VPCSecurityGroupIdList" }
        }, { "Ref": "AWS::NoValue" }]
      },
      "TracingConfig": {
        "Fn::If": ["XRAYEnabled", { "Mode": "Active" },
          { "Ref": "AWS::NoValue" }]
      },
      "Tags": [{
        Key: "Type",
        Value: "Api"
      }]
    },
    "Metadata": util.cfnNag(["W92"])
  };
}
