var fs=require('fs')
var _=require('lodash')

module.exports={
    "Lexv2BotLambda":lambda({
        "S3Bucket": {"Ref":"BootstrapBucket"},
        "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/lexv2-build.zip"},
        "S3ObjectVersion":{"Ref":"Lexv2BotCodeVersion"}
    },{
        STACKNAME:{"Ref":"AWS::StackName"},
        FULFILLMENT_LAMBDA_ARN:{"Fn::GetAtt":["FulfillmentLambda","Arn"]},
        LOCALES:{"Ref":"LexV2BotLocaleIds"},
        PYTHONPATH:"/var/task/py_modules:/var/runtime:/opt/python"
    },"python3.7"),
    "Lexv2BotCodeVersion":{
        "Type": "Custom::S3Version",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket": {"Ref":"BootstrapBucket"},
            "Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/lexv2-build.zip"},
            "BuildDate":(new Date()).toISOString()
        }
    },
    "Lexv2BotLambdaRole": {
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
        // There in no LexV2 managed policy (yet) so adding inline policy to allow creation of LexV2 ServiceLinkedRole
        "Policies":[
            {
                PolicyName:"LexV2ServiceLinkedRole",
                PolicyDocument: {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "iam:GetRole",
                                "iam:DeleteRole"
                            ],
                            "Resource": [
                                "arn:aws:iam::*:role/aws-service-role/lexv2.amazonaws.com/AWSServiceRoleForLexV2Bots*"
                            ]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "iam:CreateServiceLinkedRole"
                            ],
                            "Resource": [
                                "arn:aws:iam::*:role/aws-service-role/lexv2.amazonaws.com/AWSServiceRoleForLexV2Bots*"
                            ],
                            "Condition": {
                                "StringLike": {
                                    "iam:AWSServiceName": "lexv2.amazonaws.com"
                                }
                            }
                        },
                        {
                            "Action": [
                                "iam:PassRole"
                            ],
                            "Effect": "Allow",
                            "Resource": [
                                "arn:aws:iam::*:role/aws-service-role/lexv2.amazonaws.com/AWSServiceRoleForLexV2Bots*"
                            ],
                            "Condition": {
                                "StringLike": {
                                    "iam:PassedToService": [
                                        "lexv2.amazonaws.com"
                                    ]
                                }
                            }
                        },
                        {
                            "Action": [
                                "translate:TranslateText",
                                "comprehend:DetectDominantLanguage"
                            ],
                            "Effect": "Allow",
                            "Resource": "*"
                        }
                    ]
                }
            },
            {
                PolicyName:"BuildStatusBucketAccess",
                PolicyDocument:{
                    "Version" : "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": ["s3:Get*", "s3:Put*"],
                        "Resource":[
                            {"Fn::Sub":"arn:aws:s3:::${BuildStatusBucket}*"}
                        ]
                    }]
                }
            }
        ],
        "Path": "/",
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
          "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
          {"Ref":"QueryPolicy"},
          "arn:aws:iam::aws:policy/AmazonLexFullAccess"
        ]
      }
    }
}

function lambda(code,variable={},runtime="nodejs12.x"){
    return {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code":code,
        "Environment": {
            "Variables":variable
        },
        "Handler": "handler.handler",
        "MemorySize": "1024",
        "Role": {"Fn::GetAtt": ["Lexv2BotLambdaRole","Arn"]},
        "Runtime":runtime,
        "Timeout": 900,
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
            Value:"Api"
        }]
      }
    }
}
