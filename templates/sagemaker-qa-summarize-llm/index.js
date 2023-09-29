/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

const util = require('../util');

// Sagemaker Serverless Inference doesn't currently support the Falcon40B-Instruct model
// so although this nested template supports serverless provisioning, the main template enforces
// only provisioned endpoints by disallowing a value of '0' for SagemakerInitialInstanceCount

module.exports = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: '(SO0189n-sagemaker) QnABot nested sagemaker QA summarization resources',
    Parameters: {
        BootstrapBucket: { Type: 'String' },
        BootstrapPrefix: { Type: 'String' },
        CFNLambda: { Type: 'String' },
        SagemakerInstanceType: { Type: 'String' },
        SagemakerInitialInstanceCount: { Type: 'Number' },
        VPCSubnetIdList: { Type: 'String' },
        VPCSecurityGroupIdList: { Type: 'String' },
    },

    Conditions: {
        SagemakerServerless: { 'Fn::Equals': [{ Ref: 'SagemakerInitialInstanceCount' }, 0] },
        SagemakerProvisioned: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'SagemakerInitialInstanceCount' }, 0] }] },
        VPCEnabled: { 'Fn::Not': [{ 'Fn::Equals': ['', { Ref: 'VPCSecurityGroupIdList' }] }] },
    },

    Resources: {
        QnABotQASummarizeLLMModel: {
            Type: 'AWS::SageMaker::Model',
            Properties: {
                PrimaryContainer: {
                    Image: {
                        'Fn::Sub': '763104351884.dkr.ecr.${AWS::Region}.amazonaws.com/huggingface-pytorch-tgi-inference:2.0.0-tgi0.8.2-gpu-py39-cu118-ubuntu20.04',
                    },
                    Mode: 'SingleModel',
                    Environment: {
                        SAGEMAKER_CONTAINER_LOG_LEVEL: '20',
                        SAGEMAKER_REGION: { Ref: 'AWS::Region' },
                        HF_MODEL_ID: 'tiiuae/falcon-40b-instruct',
                        SM_NUM_GPUS: '4',
                    },
                },
                ExecutionRoleArn: {
                    'Fn::GetAtt': [
                        'QnABotQASummarizeLLMModelExecutionRole',
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
        QnABotProvisionedQASummarizeLLMEndpointConfig: {
            Condition: 'SagemakerProvisioned',
            Type: 'AWS::SageMaker::EndpointConfig',
            Properties: {
                ProductionVariants: [
                    {
                        ModelName: {
                            'Fn::GetAtt': [
                                'QnABotQASummarizeLLMModel',
                                'ModelName',
                            ],
                        },
                        InitialInstanceCount: { Ref: 'SagemakerInitialInstanceCount' },
                        InitialVariantWeight: 1,
                        InstanceType: { Ref: 'SagemakerInstanceType' },
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
        QnABotServerlessQASummarizeLLMEndpointConfig: {
            Condition: 'SagemakerServerless',
            Type: 'AWS::SageMaker::EndpointConfig',
            Properties: {
                ProductionVariants: [
                    {
                        ModelName: {
                            'Fn::GetAtt': [
                                'QnABotQASummarizeLLMModel',
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
        QnABotProvisionedQASummarizeLLMEndpoint: {
            Condition: 'SagemakerProvisioned',
            Type: 'AWS::SageMaker::Endpoint',
            Properties: {
                EndpointConfigName: {
                    'Fn::GetAtt': [
                        'QnABotProvisionedQASummarizeLLMEndpointConfig',
                        'EndpointConfigName',
                    ],
                },
            },
        },
        QnABotServerlessQASummarizeLLMEndpoint: {
            Condition: 'SagemakerServerless',
            Type: 'AWS::SageMaker::Endpoint',
            Properties: {
                EndpointConfigName: {
                    'Fn::GetAtt': [
                        'QnABotServerlessQASummarizeLLMEndpointConfig',
                        'EndpointConfigName',
                    ],
                },
            },
        },
        QnABotQASummarizeLLMModelExecutionRole: {
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
                                        { 'Fn::Sub': 'arn:${AWS::Partition}:ecr:${AWS::Region}:*:repository/huggingface-pytorch-tgi-inference' },
                                    ],
                                },

                                // ec2 permissions required for VPC access
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
            Metadata: util.cfnNag(['W11'], 'cloudwatch:PutMetricData, ecr:GetAuthorizationToken, and ec2:Describe* actions cannot be bound to a resource'),
        },
    },
    Outputs: {
        LLMSagemakerEndpoint: {
            Value: {
                'Fn::If': [
                    'SagemakerProvisioned',
                    { 'Fn::GetAtt': ['QnABotProvisionedQASummarizeLLMEndpoint', 'EndpointName'] },
                    { 'Fn::GetAtt': ['QnABotServerlessQASummarizeLLMEndpoint', 'EndpointName'] },
                ],
            },
        },
        LLMSagemakerEndpointArn: {
            Value: {
                'Fn::If': [
                    'SagemakerProvisioned',
                    { Ref: 'QnABotProvisionedQASummarizeLLMEndpoint' },
                    { Ref: 'QnABotServerlessQASummarizeLLMEndpoint' },
                ],
            },
        },
    },
};
