var fs=require('fs');
var _=require('lodash');
const util = require('../../util');

module.exports={
    "QnABotSMEmbeddingModel": {
        "Condition":"EmbeddingsSagemaker",
        "Type": "AWS::SageMaker::Model",
        "Properties": {
            "PrimaryContainer": {
                "Image": {
                    "Fn::Sub": "763104351884.dkr.ecr.${AWS::Region}.amazonaws.com/huggingface-pytorch-inference:1.10.2-transformers4.17.0-cpu-py38-ubuntu20.04"
                },
                "Mode": "SingleModel",
                "Environment": {
                    "HF_MODEL_ID":"intfloat/e5-large",
                    "HF_TASK":"feature-extraction",
                    "SAGEMAKER_CONTAINER_LOG_LEVEL":"20",
                    "SAGEMAKER_REGION":{"Ref":"AWS::Region"},
                }
            },
            "ExecutionRoleArn": {
                "Fn::GetAtt": [
                    "QnABotSMEmbeddingModelExecutionRole",
                    "Arn"
                ]
            }
        }
    },
    "QnABotSMEmbeddingEndpointConfig": {
        "Condition":"EmbeddingsSagemaker",
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
                    "InitialInstanceCount": 1,
                    "InitialVariantWeight": 1,
                    "InstanceType": "ml.m5.xlarge",
                    "VariantName": "AllTraffic"
                }
            ]
        }
    },
    "QnABotSMEmbeddingEndpoint": {
        "Condition":"EmbeddingsSagemaker",
        "Type": "AWS::SageMaker::Endpoint",
        "Properties": {
            "EndpointConfigName": {
                "Fn::GetAtt": [
                    "QnABotSMEmbeddingEndpointConfig",
                    "EndpointConfigName"
                ]
            }
        }
    },
    "QnABotSMEmbeddingModelExecutionRole": {
        "Condition":"EmbeddingsSagemaker",
        "Type": "AWS::IAM::Role",
        "Properties": {
            "AssumeRolePolicyDocument": {
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
                ],
                "Version": "2012-10-17"
            },
            "Path": "/",
            "ManagedPolicyArns": [
                "arn:aws:iam::aws:policy/AmazonSageMakerFullAccess"
            ]
        }
    }
}