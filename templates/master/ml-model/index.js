var fs=require('fs');
var _=require('lodash');
const util = require('../../util');

module.exports={
    "QnABotSMModelTarVersion": {
        "Type": "Custom::S3Version",
        "Properties": {
          "ServiceToken": { "Fn::GetAtt": ["CFNLambda", "Arn"] },
          "Bucket": { "Ref": "BootstrapBucket" },
          "Key": { "Fn::Sub": "${BootstrapPrefix}/ml_model/e5-large.tar.gz" },
          "BuildDate": (new Date()).toISOString()
        }
      },
    "QnABotSMEmbeddingModel": {
        "Condition":"EmbeddingsSagemaker",
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