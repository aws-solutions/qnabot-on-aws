/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const util = require('../util');

// Sagemaker Serverless Inference doesn't currently support the current embedding model
// so although this nested template supports serverless provisioning, the main template enforces
// only provisioned endpoints by disallowing a value of '0' for SagemakerInitialInstanceCount

module.exports = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: `(SO0189n-sagemaker) QnABot nested sagemaker embeddings resources - Version v${process.env.npm_package_version}`,
    Parameters: {
        BootstrapBucket: { Type: 'String' },
        BootstrapPrefix: { Type: 'String' },
        CFNLambda: { Type: 'String' },
        S3Clean: { Type: 'String' },
        SagemakerInitialInstanceCount: { Type: 'Number' },
        VPCSubnetIdList: { Type: 'String' },
        VPCSecurityGroupIdList: { Type: 'String' },
    },

    Conditions: {
        EmbeddingsSagemakerServerless: { 'Fn::Equals': [{ Ref: 'SagemakerInitialInstanceCount' }, 0] },
        EmbeddingsSagemakerProvisioned: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'SagemakerInitialInstanceCount' }, 0] }] },
        VPCEnabled: { 'Fn::Not': [{ 'Fn::Equals': ['', { Ref: 'VPCSecurityGroupIdList' }] }] },
    },

    Resources: {
        QnABotEmbeddingModel: {
            Type: 'AWS::SageMaker::Model',
            Properties: {
                PrimaryContainer: {
                    Image: {
                        'Fn::Sub': '763104351884.dkr.ecr.${AWS::Region}.amazonaws.com/huggingface-pytorch-inference:1.13.1-transformers4.26.0-gpu-py39-cu117-ubuntu20.04'
                    },
                    ModelDataSource: {
                        S3DataSource: {
                            S3Uri: {'Fn::Sub': 's3://jumpstart-cache-prod-${AWS::Region}/huggingface-sentencesimilarity/huggingface-sentencesimilarity-e5-large-v2/artifacts/inference-prepack/v1.0.2/' },
                            S3DataType: "S3Prefix",
                            CompressionType: "None",
                            ModelAccessConfig: {
                                AcceptEula: true
                            }
                        }
                    },
                    Environment: {
                        ENDPOINT_SERVER_TIMEOUT: "3600",
                        SAGEMAKER_ENV: "1",
                        MODEL_CACHE_ROOT: "/opt/ml/model",
                        SAGEMAKER_MODEL_SERVER_WORKERS: "1",
                        SAGEMAKER_PROGRAM: "inference.py",
                    },
                },
                ExecutionRoleArn: {
                    'Fn::GetAtt': [
                        'QnABotEmbeddingModelExecutionRole',
                        'Arn',
                    ],
                },
                VpcConfig: {
                    'Fn::If': [
                        'VPCEnabled',
                        {
                            Subnets: { 'Fn::Split': [',', { Ref: 'VPCSubnetIdList' }] },
                            SecurityGroupIds: { 'Fn::Split': [',', { Ref: 'VPCSecurityGroupIdList' }] },
                        },
                        { Ref: 'AWS::NoValue' },
                    ],
                },
            },
        },
        QnABotProvisionedEmbeddingEndpointConfig: {
            Condition: 'EmbeddingsSagemakerProvisioned',
            Type: 'AWS::SageMaker::EndpointConfig',
            Properties: {
                ProductionVariants: [
                    {
                        ModelName: {
                            'Fn::GetAtt': [
                                'QnABotEmbeddingModel',
                                'ModelName',
                            ],
                        },
                        InitialInstanceCount: { Ref: 'SagemakerInitialInstanceCount' },
                        InitialVariantWeight: 1,
                        InstanceType: 'ml.m5.xlarge',
                        VariantName: 'AllTraffic',
                    },
                ],
            },
            Metadata: {
                cfn_nag: {
                    rules_to_suppress: [
                        {
                            id: 'W1200',
                            reason: 'Default transient keys used by SageMaker for encryption is sufficient for use case',
                        },
                    ],
                },
            },
        },
        QnABotServerlessEmbeddingEndpointConfig: {
            Condition: 'EmbeddingsSagemakerServerless',
            Type: 'AWS::SageMaker::EndpointConfig',
            Properties: {
                ProductionVariants: [
                    {
                        ModelName: {
                            'Fn::GetAtt': [
                                'QnABotEmbeddingModel',
                                'ModelName',
                            ],
                        },
                        InitialVariantWeight: 1,
                        VariantName: 'AllTraffic',
                        ServerlessConfig: {
                            MaxConcurrency: 50,
                            MemorySizeInMB: 4096,
                        },
                    },
                ],
            },
            Metadata: {
                cfn_nag: {
                    rules_to_suppress: [
                        {
                            id: 'W1200',
                            reason: 'Default transient keys used by SageMaker for encryption is sufficient for use case',
                        },
                    ],
                },
            },

        },
        QnABotProvisionedEmbeddingEndpoint: {
            Condition: 'EmbeddingsSagemakerProvisioned',
            Type: 'AWS::SageMaker::Endpoint',
            Properties: {
                EndpointConfigName: {
                    'Fn::GetAtt': [
                        'QnABotProvisionedEmbeddingEndpointConfig',
                        'EndpointConfigName',
                    ],
                },
            },
        },
        QnABotServerlessEmbeddingEndpoint: {
            Condition: 'EmbeddingsSagemakerServerless',
            Type: 'AWS::SageMaker::Endpoint',
            Properties: {
                EndpointConfigName: {
                    'Fn::GetAtt': [
                        'QnABotServerlessEmbeddingEndpointConfig',
                        'EndpointConfigName',
                    ],
                },
            },
        },
        QnABotEmbeddingModelExecutionRole: {
            Type: 'AWS::IAM::Role',
            Properties: {
                AssumeRolePolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Action: [
                                'sts:AssumeRole',
                            ],
                            Effect: 'Allow',
                            Principal: {
                                Service: [
                                    'sagemaker.amazonaws.com',
                                ],
                            },
                        },
                    ],
                },
                Path: '/',
                Policies: [
                    {
                        PolicyName: 'S3Policy',
                        PolicyDocument: {
                            Version: '2012-10-17',
                            Statement: [
                                {
                                    Effect: 'Allow',
                                    Action: [
                                        "s3:GetObject",
                                        "s3:ListBucket"

                                    ],
                                    Resource: [
                                        { 'Fn::Sub': 'arn:${AWS::Partition}:s3:::jumpstart-cache-prod-${AWS::Region}*' },
                                    ],
                                },
                                {
                                    Effect: 'Allow',
                                    Action: [
                                        'logs:CreateLogStream',
                                        'logs:CreateLogGroup',
                                        'logs:DescribeLogStreams',
                                    ],
                                    Resource: [
                                        { 'Fn::Sub': 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/sagemaker/*' },
                                    ],
                                },
                                {
                                    Effect: 'Allow',
                                    Action: [
                                        'logs:PutLogEvents',
                                    ],
                                    Resource: [
                                        { 'Fn::Sub': 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/sagemaker/*:log-stream:*' },
                                    ],
                                },
                                {
                                    Effect: 'Allow',
                                    Action: [
                                        'cloudwatch:PutMetricData',
                                        'ecr:GetAuthorizationToken',
                                    ],
                                    Resource: [
                                        // these actions cannot be bound to resources other than *
                                        '*',
                                    ],
                                },
                                {
                                    Effect: 'Allow',
                                    Action: [
                                        'ecr:BatchCheckLayerAvailability',
                                        'ecr:GetDownloadUrlForLayer',
                                        'ecr:BatchGetImage',
                                    ],
                                    Resource: [
                                        { 'Fn::Sub': 'arn:${AWS::Partition}:ecr:${AWS::Region}:*:repository/huggingface-pytorch-inference' },
                                    ],
                                },

                                // ec2 permissions required for VPC access // https://docs.aws.amazon.com/sagemaker/latest/dg/host-vpc.html
                                {
                                    Action: [
                                        'ec2:DescribeVpcEndpoints',
                                        'ec2:DescribeDhcpOptions',
                                        'ec2:DescribeVpcs',
                                        'ec2:DescribeSubnets',
                                        'ec2:DescribeSecurityGroups',
                                        'ec2:DescribeNetworkInterfaces',
                                    ],
                                    Resource: [
                                        // these actions cannot be bound to resources other than *
                                        '*',
                                    ],
                                    Effect: 'Allow',
                                },
                                {
                                    Action: [
                                        'ec2:CreateNetworkInterface',
                                        'ec2:CreateNetworkInterfacePermission',
                                    ],
                                    Resource: [
                                        { 'Fn::Sub': 'arn:${AWS::Partition}:ec2:${AWS::Region}:${AWS::AccountId}:network-interface/*' },
                                        { 'Fn::Sub': 'arn:${AWS::Partition}:ec2:${AWS::Region}:${AWS::AccountId}:subnet/*' },
                                        { 'Fn::Sub': 'arn:${AWS::Partition}:ec2:${AWS::Region}:${AWS::AccountId}:security-group/*' },
                                    ],
                                    Effect: 'Allow',
                                },
                            ],
                        },
                    },
                ],
            },
            Metadata: {
                cfn_nag: util.cfnNag(['W11'], 'cloudwatch:PutMetricData, ecr:GetAuthorizationToken, and ec2:Describe* actions cannot be bound to a resource'),
                guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK'),
            },
        },
    },
    Outputs: {
        EmbeddingsSagemakerEndpoint: {
            Value: {
                'Fn::If': [
                    'EmbeddingsSagemakerProvisioned',
                    { 'Fn::GetAtt': ['QnABotProvisionedEmbeddingEndpoint', 'EndpointName'] },
                    { 'Fn::GetAtt': ['QnABotServerlessEmbeddingEndpoint', 'EndpointName'] },
                ],
            },
        },
        EmbeddingsSagemakerEndpointArn: {
            Value: {
                'Fn::If': [
                    'EmbeddingsSagemakerProvisioned',
                    { Ref: 'QnABotProvisionedEmbeddingEndpoint' },
                    { Ref: 'QnABotServerlessEmbeddingEndpoint' },
                ],
            },
        },
    },
};
