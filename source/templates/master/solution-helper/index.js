/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
                {
                    PolicyName: 'SettingsTableReadAccess',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Action: [
                                    'dynamodb:Scan',
                                ],
                                Resource: [{  'Fn::Sub': "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${SettingsTable}" }],
                            },
                        ],
                    },
                },
                {
                    PolicyName: 'GetParameterPolicy',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [{
                            Effect: 'Allow',
                            Action: ['ssm:GetParameter'],
                            Resource: [
                                {
                                    'Fn::Join': [
                                        '', [
                                            'arn:',
                                            { 'Fn::Sub': '${AWS::Partition}:' },
                                            'ssm:',
                                            { 'Fn::Sub': '${AWS::Region}:' },
                                            { 'Fn::Sub': '${AWS::AccountId}:' },
                                            'parameter/',
                                            { Ref: 'SolutionHelperParameter' },
                                        ],
                                    ],
                                },
                            ],
                        }],
                    },
                },
                {
                    PolicyName: 'PutParameterPolicy',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [{
                            Effect: 'Allow',
                            Action: ['ssm:PutParameter'],
                            Resource: [
                                {
                                    'Fn::Join': [
                                        '', [
                                            'arn:',
                                            { 'Fn::Sub': '${AWS::Partition}:' },
                                            'ssm:',
                                            { 'Fn::Sub': '${AWS::Region}:' },
                                            { 'Fn::Sub': '${AWS::AccountId}:' },
                                            'parameter/',
                                            { Ref: 'SolutionHelperParameter' },
                                        ],
                                    ],
                                },
                            ],
                        }],
                    },
                },
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
    SolutionHelperLogGroup: {
        Type: 'AWS::Logs::LogGroup',
        Properties: {
            LogGroupName: {
                'Fn::Join': [
                    '-',
                    [
                        { 'Fn::Sub': '/aws/lambda/${AWS::StackName}-SolutionHelper' },
                        { 'Fn::Select': ['2', { 'Fn::Split': ['/', { Ref: 'AWS::StackId' }] }] },
                    ],
                ],
            },
            RetentionInDays: {
                'Fn::If': [
                    'LogRetentionPeriodIsNotZero',
                    { Ref: 'LogRetentionPeriod' },
                    { Ref: 'AWS::NoValue' },
                ],
            },
        },
        Metadata: {
            guard: util.cfnGuard('CLOUDWATCH_LOG_GROUP_ENCRYPTED', 'CW_LOGGROUP_RETENTION_PERIOD_CHECK'),
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
            LoggingConfig: {
                LogGroup: { Ref: 'SolutionHelperLogGroup' },
            },
            Role: {
                'Fn::GetAtt': ['SolutionHelperRole', 'Arn'],
            },
            Environment: {
                Variables: {
                    SOLUTION_PARAMETER: { Ref: 'SolutionHelperParameter' },
                    SETTINGS_TABLE: { Ref: 'SettingsTable' },
                    SOLUTION_ID : util.getCommonEnvironmentVariables().SOLUTION_ID,
                },
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
            OpenSearchNodeInstanceType: {
                'Fn::If': [
                    'CreateDomain',
                    { Ref: 'OpenSearchNodeInstanceType' },
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
            InstallLexResponseBots: { Ref: 'InstallLexResponseBots' },
            EmbeddingsApi: { Ref: 'EmbeddingsApi' },
            EmbeddingsBedrockModelId: {
                'Fn::If': [
                    'EmbeddingsBedrock',
                    { Ref: 'EmbeddingsBedrockModelId' },
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
            KendraPluginsEnabled: {
                'Fn::If': [
                    'KendraPluginsEnabled',
                    'YES',
                    'NO',
                ],
            },
            OpenSearchFineGrainAccessControl: { Ref: 'OpenSearchFineGrainAccessControl'},
            EnableStreaming: { Ref: 'EnableStreaming' }
        },
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
        Condition: 'SolutionHelperSendAnonymizedDataToAWS',
    },
};
