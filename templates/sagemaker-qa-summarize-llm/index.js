const util = require('../util');

// Sagemaker Serverless Inference doesn't currently support the flan-t5-xxl model
// so although this nested template supports serverless provisioning, the main template enforces
// only provisioned endpoints by disallowing a value of '0' for SagemakerInitialInstanceCount

module.exports={
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "(SO0189n-sagemaker) QnABot nested sagemaker QA summarization resources",
    "Parameters": {
        "BootstrapBucket":{"Type":"String"},
        "BootstrapPrefix":{"Type":"String"},
        "CFNLambda":{"Type":"String"},
        "SagemakerInitialInstanceCount":{"Type":"Number"},
        "VPCSubnetIdList":{"Type": "String"},
        "VPCSecurityGroupIdList":{"Type": "String"},
    },

    "Conditions": {
        "SagemakerServerless":{"Fn::Equals":[{"Ref":"SagemakerInitialInstanceCount"},0]},
        "SagemakerProvisioned":{"Fn::Not":[{"Fn::Equals":[{"Ref":"SagemakerInitialInstanceCount"},0]}]},
        "VPCEnabled": {"Fn::Not":[{"Fn::Equals":["",{ "Ref": "VPCSecurityGroupIdList"}]}]},
    },

    "Resources": {
        "QnABotModelTarVersion": {
            "Type": "Custom::S3Version",
            "Properties": {
                "ServiceToken": { "Ref": "CFNLambda" },
                "Bucket": { "Ref": "BootstrapBucket" },
                "Key": { "Fn::Sub": "${BootstrapPrefix}/ml_model/flan-t5-xxl-sharded-fp16.tar.gz" },
                "BuildDate": (new Date()).toISOString()
            }
        },
        "QnABotQASummarizeLLMModel": {
            "Type": "AWS::SageMaker::Model",
            "Properties": {
                "PrimaryContainer": {
                    "Image": {
                        "Fn::Sub": "763104351884.dkr.ecr.${AWS::Region}.amazonaws.com/huggingface-pytorch-inference:1.10-transformers4.17-gpu-py38-cu113-ubuntu20.04"
                    },
                    "ModelDataUrl":{"Fn::Sub":"s3://${BootstrapBucket}/${BootstrapPrefix}/ml_model/flan-t5-xxl-sharded-fp16.tar.gz"},
                    "Mode": "SingleModel",
                    "Environment": {
                        "SAGEMAKER_CONTAINER_LOG_LEVEL":"20",
                        "SAGEMAKER_REGION":{"Ref":"AWS::Region"},
                        "S3_MODEL_DATA_VERSION": {"Ref":"QnABotModelTarVersion"}, // force model replace when new version of tar file is available
                    }
                },
                "ExecutionRoleArn": {
                    "Fn::GetAtt": [
                        "QnABotQASummarizeLLMModelExecutionRole",
                        "Arn"
                    ]
                },
                "VpcConfig" : {
                    "Fn::If": [
                        "VPCEnabled",
                        {
                            "Subnets": {"Fn::Split":[",",{"Ref":"VPCSubnetIdList"}]},
                            "SecurityGroupIds":{"Fn::Split":[",",{"Ref":"VPCSecurityGroupIdList"}]},
                        },
                        {"Ref" : "AWS::NoValue"}
                    ]
                }
            }
        },
        "QnABotProvisionedQASummarizeLLMEndpointConfig": {
            "Condition":"SagemakerProvisioned",
            "Type": "AWS::SageMaker::EndpointConfig",
            "Properties": {
                "ProductionVariants": [
                    {
                        "ModelName": {
                            "Fn::GetAtt": [
                                "QnABotQASummarizeLLMModel",
                                "ModelName"
                            ]
                        },
                        "InitialInstanceCount": {"Ref":"SagemakerInitialInstanceCount"},
                        "InitialVariantWeight": 1,
                        "InstanceType": "ml.g5.xlarge",
                        "VariantName": "AllTraffic",
                    }
                ]
            },
            "Metadata": {
                "cfn_nag": {
                    "rules_to_suppress": [
                        {
                            "id": "W1200",
                            "reason": "Default transient keys used by SageMaker for encryption is sufficient for use case"
                        }
                    ]
                }
            }
        },
        "QnABotServerlessQASummarizeLLMEndpointConfig": {
            "Condition":"SagemakerServerless",
            "Type": "AWS::SageMaker::EndpointConfig",
            "Properties": {
                "ProductionVariants": [
                    {
                        "ModelName": {
                            "Fn::GetAtt": [
                                "QnABotQASummarizeLLMModel",
                                "ModelName"
                            ]
                        },
                        "InitialVariantWeight": 1,
                        "VariantName": "AllTraffic",
                        "ServerlessConfig": {
                            "MaxConcurrency" : 50,
                            "MemorySizeInMB" : 4096
                        }
                    }
                ]
            },
            "Metadata": {
                "cfn_nag": {
                    "rules_to_suppress": [
                        {
                            "id": "W1200",
                            "reason": "Default transient keys used by SageMaker for encryption is sufficient for use case"
                        }
                    ]
                }
            }

        },
        "QnABotProvisionedQASummarizeLLMEndpoint": {
            "Condition":"SagemakerProvisioned",
            "Type": "AWS::SageMaker::Endpoint",
            "Properties": {
                "EndpointConfigName": {
                    "Fn::GetAtt": [
                        "QnABotProvisionedQASummarizeLLMEndpointConfig",
                        "EndpointConfigName"
                    ]
                }
            }
        },
        "QnABotServerlessQASummarizeLLMEndpoint": {
            "Condition":"SagemakerServerless",
            "Type": "AWS::SageMaker::Endpoint",
            "Properties": {
                "EndpointConfigName": {
                    "Fn::GetAtt": [
                        "QnABotServerlessQASummarizeLLMEndpointConfig",
                        "EndpointConfigName"
                    ]
                }
            }
        },
        "QnABotQASummarizeLLMModelExecutionRole": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "AssumeRolePolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Action": [
                                "sts:AssumeRole"
                            ],
                            "Effect": "Allow",
                            "Principal": {
                                "Service": [
                                    "sagemaker.amazonaws.com"
                                ]
                            }
                        }
                    ]
                },
                "Path": "/",
                "Policies": [
                    {
                        "PolicyName": "S3Policy",
                        "PolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "s3:GetObject"
                                     ],
                                    "Resource": [
                                        {"Fn::Sub":"arn:${AWS::Partition}:s3:::${BootstrapBucket}/${BootstrapPrefix}/ml_model/flan-t5-xxl-sharded-fp16.tar.gz"}
                                    ]
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "logs:CreateLogStream",
                                        "logs:CreateLogGroup",
                                        "logs:DescribeLogStreams",
                                    ],
                                    "Resource": [
                                        {"Fn::Sub":"arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/sagemaker/*"}
                                    ]
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "logs:PutLogEvents",
                                    ],
                                    "Resource": [
                                        {"Fn::Sub":"arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/sagemaker/*:log-stream:*"}
                                    ]
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "cloudwatch:PutMetricData",
                                        "ecr:GetAuthorizationToken"
                                    ],
                                    "Resource": [
                                        // these actions cannot be bound to resources other than *
                                        "*"
                                    ]
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "ecr:BatchCheckLayerAvailability",
                                        "ecr:GetDownloadUrlForLayer",
                                        "ecr:BatchGetImage"
                                    ],
                                    "Resource": [
                                        {"Fn::Sub":"arn:${AWS::Partition}:ecr:${AWS::Region}:*:repository/huggingface-pytorch-inference"}
                                    ]
                                },

                                //ec2 permissions required for VPC access
                                {
                                    "Action": [
                                        "ec2:DescribeVpcEndpoints",
                                        "ec2:DescribeDhcpOptions",
                                        "ec2:DescribeVpcs",
                                        "ec2:DescribeSubnets",
                                        "ec2:DescribeSecurityGroups",
                                        "ec2:DescribeNetworkInterfaces"
                                    ],
                                    "Resource": [
                                        // these actions cannot be bound to resources other than *
                                        "*"
                                    ],
                                    "Effect": "Allow"
                                },
                                {
                                    "Action": [
                                        "ec2:CreateNetworkInterface",
                                        "ec2:CreateNetworkInterfacePermission"
                                    ],
                                    "Resource": [
                                        {"Fn::Sub":"arn:${AWS::Partition}:ec2:${AWS::Region}:${AWS::AccountId}:network-interface/*"},
                                        {"Fn::Sub":"arn:${AWS::Partition}:ec2:${AWS::Region}:${AWS::AccountId}:subnet/*"},
                                        {"Fn::Sub":"arn:${AWS::Partition}:ec2:${AWS::Region}:${AWS::AccountId}:security-group/*"}
                                    ],
                                    "Effect": "Allow"
                                }
                            ]
                        }
                    }
                ]
            },
            "Metadata": util.cfnNag(["W11"], "cloudwatch:PutMetricData, ecr:GetAuthorizationToken, and ec2:Describe* actions cannot be bound to a resource")
        }
    },
    "Outputs": {
        "QASummarizeSagemakerLLMEndpoint": {
            "Value": {
                "Fn::If": [
                    "SagemakerProvisioned",
                    {"Fn::GetAtt":["QnABotProvisionedQASummarizeLLMEndpoint","EndpointName"]},
                    {"Fn::GetAtt":["QnABotServerlessQASummarizeLLMEndpoint","EndpointName"]}
                ]
            }
        },
        "QASummarizeSagemakerLLMEndpointArn": {
            "Value":{
                "Fn::If": [
                    "SagemakerProvisioned",
                    {"Ref":"QnABotProvisionedQASummarizeLLMEndpoint"},
                    {"Ref":"QnABotServerlessQASummarizeLLMEndpoint"}
                ]
            }
        }
    }
}