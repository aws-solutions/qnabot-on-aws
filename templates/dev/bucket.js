const outputs = require('../../bin/exports');
const util = require('../util');

module.exports = outputs('dev/bootstrap')
  .then(function (output) {
    return {
      "Description": "This template creates dev ElasticSearch Cluster",
      "Resources": {
        "Bucket": {
          "Type": "AWS::S3::Bucket",
          "DeletionPolicy": "Delete",
          "Properties": {
            "VersioningConfiguration": {
              "Status": "Enabled"
            },
            "BucketEncryption": {
              "ServerSideEncryptionConfiguration": [
                {
                  "ServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                  }
                }
              ]
            },
            "PublicAccessBlockConfiguration": {
              "BlockPublicAcls": true,
              "BlockPublicPolicy": true,
              "IgnorePublicAcls": true,
              "RestrictPublicBuckets": true
            }
          },
          "Metadata": util.cfnNag(["W35"])
        },
        "Clear": {
          "Type": "Custom::S3Clear",
          "DependsOn": ["CFNLambdaPolicy"],
          "Properties": {
            "ServiceToken": { "Fn::GetAtt": ["CFNLambda", "Arn"] },
            "Bucket": { "Ref": "Bucket" }
          }
        },
        "CFNLambda": {
          "Type": "AWS::Lambda::Function",
          "Properties": {
            "Code": {
              "S3Bucket": output.Bucket,
              "S3Key": {
                "Fn::Join": ["", [
                  output.Prefix,
                  "/lambda/cfn.zip"
                ]]
              }
            },
            "Handler": "index.handler",
            "MemorySize": "128",
            "Role": { "Fn::GetAtt": ["CFNLambdaRole", "Arn"] },
            "Runtime": "nodejs12.x",
            "Timeout": 60
          },
          "Metadata": util.cfnNag(["W92"])
        },
        "CFNLambdaRole": {
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
            "Policies": [util.basicLambdaExecutionPolicy()],
            "Path": "/",
            "ManagedPolicyArns": [
              { "Ref": "CFNLambdaPolicy" }
            ]
          },
          "Metadata": util.cfnNag(["W11", "F3"])
        },
        "CFNLambdaPolicy": {
          "Type": "AWS::IAM::ManagedPolicy",
          "Properties": {
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*"
                  ],
                  "Resource": [
                    { "Fn::Sub": "arn:aws:s3:::${Bucket}*" },
                  ]
                }
              ]
            }
          }
        }
      },
      "Outputs": {
        "Bucket": {
          "Value": { "Ref": "Bucket" }
        }
      }
    };
  });
