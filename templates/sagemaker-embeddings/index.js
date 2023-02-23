const util = require('../util');

module.exports={
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "(SO0189n-sagemaker) QnABot nested sagemaker embeddings resources",
    "Parameters": {
        "BootstrapBucket":{"Type":"String"},
        "BootstrapPrefix":{"Type":"String"},
        "CFNLambda":{"Type":"String"},
        "SagemakerInitialInstanceCount":{"Type":"Number"},
        "VPCSubnetIdList":{"Type": "String"},
        "VPCSecurityGroupIdList":{"Type": "String"},
    },

    "Conditions": {
        "EmbeddingsSagemakerServerless":{"Fn::Equals":[{"Ref":"SagemakerInitialInstanceCount"},0]},
        "EmbeddingsSagemakerProvisioned":{"Fn::Not":[{"Fn::Equals":[{"Ref":"SagemakerInitialInstanceCount"},0]}]},
        "VPCEnabled": {"Fn::Not":[{"Fn::Equals":["",{ "Ref": "VPCSecurityGroupIdList"}]}]},
    },

    "Resources": {
        "QnABotSMModelTarVersion": {
            "Type": "Custom::S3Version",
            "Properties": {
                "ServiceToken": { "Ref": "CFNLambda" },
                "Bucket": { "Ref": "BootstrapBucket" },
                "Key": { "Fn::Sub": "${BootstrapPrefix}/ml_model/e5-large.tar.gz" },
                "BuildDate": (new Date()).toISOString()
            }
        },
        "QnABotSMEmbeddingModel": {
            "Type": "AWS::SageMaker::Model",
            "Properties": {
                "PrimaryContainer": {
                    "Image": {
                        "Fn::Sub": "763104351884.dkr.ecr.${AWS::Region}.amazonaws.com/huggingface-pytorch-inference:1.10.2-transformers4.17.0-cpu-py38-ubuntu20.04"
                    },
                    "ModelDataUrl":{"Fn::Sub":"s3://${BootstrapBucket}/${BootstrapPrefix}/ml_model/e5-large.tar.gz"},
                    "Mode": "SingleModel",
                    "Environment": {
                        "SAGEMAKER_CONTAINER_LOG_LEVEL":"20",
                        "SAGEMAKER_REGION":{"Ref":"AWS::Region"},
                        "S3_MODEL_DATA_VERSION": {"Ref":"QnABotSMModelTarVersion"}, // force model replace when new version of tar file is available
                    }
                },
                "ExecutionRoleArn": {
                    "Fn::GetAtt": [
                        "QnABotSMEmbeddingModelExecutionRole",
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
        "QnABotSMProvisionedEmbeddingEndpointConfig": {
            "Condition":"EmbeddingsSagemakerProvisioned",
            "Type": "AWS::SageMaker::EndpointConfig",
            "Properties": {
                "ProductionVariants": [
                    {
                        "ModelName": {
                            "Fn::GetAtt": [
                                "QnABotSMEmbeddingModel",
                                "ModelName"
                            ]
                        },
                        "InitialInstanceCount": {"Ref":"SagemakerInitialInstanceCount"},
                        "InitialVariantWeight": 1,
                        "InstanceType": "ml.m5.xlarge",
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
        "QnABotSMServerlessEmbeddingEndpointConfig": {
            "Condition":"EmbeddingsSagemakerServerless",
            "Type": "AWS::SageMaker::EndpointConfig",
            "Properties": {
                "ProductionVariants": [
                    {
                        "ModelName": {
                            "Fn::GetAtt": [
                                "QnABotSMEmbeddingModel",
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
        "QnABotSMProvisionedEmbeddingEndpoint": {
            "Condition":"EmbeddingsSagemakerProvisioned",
            "Type": "AWS::SageMaker::Endpoint",
            "Properties": {
                "EndpointConfigName": {
                    "Fn::GetAtt": [
                        "QnABotSMProvisionedEmbeddingEndpointConfig",
                        "EndpointConfigName"
                    ]
                }
            }
        },
        "QnABotSMServerlessEmbeddingEndpoint": {
            "Condition":"EmbeddingsSagemakerServerless",
            "Type": "AWS::SageMaker::Endpoint",
            "Properties": {
                "EndpointConfigName": {
                    "Fn::GetAtt": [
                        "QnABotSMServerlessEmbeddingEndpointConfig",
                        "EndpointConfigName"
                    ]
                }
            }
        },
        "QnABotSMEmbeddingModelExecutionRole": {
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
                                        {"Fn::Sub":"arn:${AWS::Partition}:s3:::${BootstrapBucket}/${BootstrapPrefix}/ml_model/e5-large.tar.gz"}
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
        "EmbeddingsSagemakerEndpoint": {
            "Value": {
                "Fn::If": [
                    "EmbeddingsSagemakerProvisioned",
                    {"Fn::GetAtt":["QnABotSMProvisionedEmbeddingEndpoint","EndpointName"]},
                    {"Fn::GetAtt":["QnABotSMServerlessEmbeddingEndpoint","EndpointName"]}
                ]
            }
        },
        "EmbeddingsSagemakerEndpointArn": {
            "Value":{
                "Fn::If": [
                    "EmbeddingsSagemakerProvisioned",
                    {"Ref":"QnABotSMProvisionedEmbeddingEndpoint"},
                    {"Ref":"QnABotSMServerlessEmbeddingEndpoint"}
                ]
            }
        }
    }
}