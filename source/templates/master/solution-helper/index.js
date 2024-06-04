/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

const util = require('../../util');

module.exports = {
    SolutionHelperRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: ['lambda.amazonaws.com'],
                        },
                        Action: ['sts:AssumeRole'],
                    },
                ],
            },
            Policies: [
                util.basicLambdaExecutionPolicy(),
                util.lambdaVPCAccessExecutionRole(),
                util.xrayDaemonWriteAccess(),
            ],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W11', 'W12']),
            guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK'),
        },
    },
    SolutionHelperCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/solution-helper.zip' },
            BuildDate: (new Date()).toISOString(),
        },
    },
    SolutionHelper: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/solution-helper.zip' },
                S3ObjectVersion: { Ref: 'SolutionHelperCodeVersion' },
            },
            Description: 'This function generates UUID for each deployment and sends anonymized data to the AWS Solutions team',
            Handler: 'lambda_function.handler',
            Role: {
                'Fn::GetAtt': ['SolutionHelperRole', 'Arn'],
            },
            Runtime: process.env.npm_package_config_pythonRuntime,
            Timeout: 300,
            VpcConfig: {
                'Fn::If': [
                    'VPCEnabled',
                    {
                        SubnetIds: { Ref: 'VPCSubnetIdList' },
                        SecurityGroupIds: { Ref: 'VPCSecurityGroupIdList' },
                    },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            TracingConfig: {
                'Fn::If': [
                    'XRAYEnabled',
                    { Mode: 'Active' },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            Tags: [{
                Key: 'Type',
                Value: 'Solution Helper',
            }],
        },
        DependsOn: [
            'SolutionHelperRole',
        ],
        Metadata: {
            cfn_nag: util.cfnNag(['W89', 'W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    },
    SolutionHelperCreateUniqueID: {
        Type: 'Custom::CreateUUID',
        Properties: {
            ServiceToken: {
                'Fn::GetAtt': [
                    'SolutionHelper',
                    'Arn',
                ],
            },
            Resource: 'UUID',
        },
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
        Condition: 'SolutionHelperSendAnonymizedDataToAWS',
    },
    SolutionHelperSendAnonymizedData: {
        Type: 'Custom::AnonymizedData',
        Properties: {
            ServiceToken: {
                'Fn::GetAtt': [
                    'SolutionHelper',
                    'Arn',
                ],
            },
            Resource: 'AnonymizedMetric',
            UUID: {
                'Fn::GetAtt': [
                    'SolutionHelperCreateUniqueID',
                    'UUID',
                ],
            },
            Region: { Ref: 'AWS::Region' },
            SolutionId: util.getCommonEnvironmentVariables().SOLUTION_ID,
            Version: util.getCommonEnvironmentVariables().SOLUTION_VERSION,
            OpenSearchInstanceType: {
                'Fn::If': [
                    'CreateDomain',
                    { Ref: 'OpenSearchInstanceType' },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            PublicOrPrivate: { Ref: 'PublicOrPrivate' },
            Language: { Ref: 'Language' },
            OpenSearchNodeCount: {
                'Fn::If': [
                    'CreateDomain',
                    { Ref: 'OpenSearchNodeCount' },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            OpenSearchEBSVolumeSize: {
                'Fn::If': [
                    'CreateDomain',
                    { Ref: 'OpenSearchEBSVolumeSize' },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            FulfillmentConcurrency: { Ref: 'FulfillmentConcurrency' },
            LexBotVersion: { Ref: 'LexBotVersion' },
            InstallLexResponseBots: { Ref: 'InstallLexResponseBots' },
            EmbeddingsApi: { Ref: 'EmbeddingsApi' },
            EmbeddingsBedrockModelId: {
                'Fn::If': [
                    'EmbeddingsBedrock',
                    { Ref: 'EmbeddingsBedrockModelId' },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            SagemakerInitialInstanceCount: {
                'Fn::If': [
                    'EmbeddingsSagemaker',
                    { Ref: 'SagemakerInitialInstanceCount' },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            LLMApi: { Ref: 'LLMApi' },
            LLMBedrockModelId: {
                'Fn::If': [
                    'LLMBedrock',
                    { Ref: 'LLMBedrockModelId' },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            BedrockKnowledgeBaseModel: {
                'Fn::If': [
                    'BedrockKnowledgeBaseEnable',
                    { Ref: 'BedrockKnowledgeBaseModel' },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            LLMSagemakerInstanceType: {
                'Fn::If': [
                    'LLMSagemaker',
                    { Ref: 'LLMSagemakerInstanceType' },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            LLMSagemakerInitialInstanceCount: {
                'Fn::If': [
                    'LLMSagemaker',
                    { Ref: 'LLMSagemakerInitialInstanceCount' },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            KendraPluginsEnabled: {
                'Fn::If': [
                    'KendraPluginsEnabled',
                    'YES',
                    'NO',
                ],
            },
        },
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
        Condition: 'SolutionHelperSendAnonymizedDataToAWS',
    },
};
