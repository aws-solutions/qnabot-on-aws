/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const util = require('../../util');

const examples = _.fromPairs(require('../../examples/outputs')
    .names
    .map((x) => [x, { 'Fn::GetAtt': ['ExamplesStack', `Outputs.${x}`] }]));
const responsebots = _.fromPairs(require('../../examples/examples/responsebots-lexv2')
    .names
    .map((x) => [x, { 'Fn::GetAtt': ['ExamplesStack', `Outputs.${x}`] }]));

module.exports = {
    Alexa: {
        Type: 'AWS::Lambda::Permission',
        DependsOn: 'FulfillmentLambdaAliaslive',
        Properties: {
            Action: 'lambda:InvokeFunction',
            FunctionName: {
                'Fn::Join': [':', [
                    { 'Fn::GetAtt': ['FulfillmentLambda', 'Arn'] },
                    'live',
                ]],
            },
            Principal: 'alexa-appkit.amazon.com'
        },
    },
    FulfillmentCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/fulfillment.zip' },
            BuildDate: (new Date()).toISOString(),
        },
    },
    FulfillmentLambdaLogGroup: {
        Type: 'AWS::Logs::LogGroup',
        Properties: {
            LogGroupName: {
                'Fn::Join': [
                    '-',
                    [
                        { 'Fn::Sub': '/aws/lambda/${AWS::StackName}-FulfillmentLambda' },
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
    FulfillmentLambda: {
        Type: 'AWS::Lambda::Function',
        DependsOn: 'FulfillmentCodeVersion',
        Properties: {
            Code: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/fulfillment.zip' },
                S3ObjectVersion: { Ref: 'FulfillmentCodeVersion' },
            },
            // Note: updates to this lambda function do not automatically generate a new version
            // if making changes here, be sure to update FulfillmentLambdaVersionGenerator as appropriate
            Environment: {
                Variables: {
                    'Fn::If': [
                        'BuildExamples',
                        {
                            ES_TYPE: { 'Fn::GetAtt': ['Var', 'QnAType'] },
                            ES_INDEX: { 'Fn::GetAtt': ['Var', 'QnaIndex'] },
                            ES_ADDRESS: { 'Fn::GetAtt': ['ESVar', 'ESAddress'] },
                            LAMBDA_DEFAULT_QUERY: { Ref: 'ESQueryLambda' },
                            LAMBDA_LOG: { Ref: 'ESLoggingLambda' },
                            ES_SERVICE_QID: { Ref: 'ESQidLambda' },
                            ES_SERVICE_PROXY: { Ref: 'ESProxyLambda' },
                            DYNAMODB_USERSTABLE: { Ref: 'UsersTable' },
                            DEFAULT_USER_POOL_JWKS_PARAM: { Ref: 'DefaultUserPoolJwksUrl' },
                            SETTINGS_TABLE: { Ref: 'SettingsTable' },
                            EMBEDDINGS_API: { Ref: 'EmbeddingsApi' },
                            EMBEDDINGS_LAMBDA_ARN: { Ref: 'EmbeddingsLambdaArn' },
                            LLM_API: { Ref: 'LLMApi' },
                            LLM_LAMBDA_ARN: { Ref: 'LLMLambdaArn' },
                            ...examples,
                            ...responsebots,
                            ...util.getCommonEnvironmentVariables(),
                        },
                        {
                            ES_TYPE: { 'Fn::GetAtt': ['Var', 'QnAType'] },
                            ES_INDEX: { 'Fn::GetAtt': ['Var', 'QnaIndex'] },
                            ES_ADDRESS: { 'Fn::GetAtt': ['ESVar', 'ESAddress'] },
                            LAMBDA_DEFAULT_QUERY: { Ref: 'ESQueryLambda' },
                            LAMBDA_LOG: { Ref: 'ESLoggingLambda' },
                            ES_SERVICE_QID: { Ref: 'ESQidLambda' },
                            ES_SERVICE_PROXY: { Ref: 'ESProxyLambda' },
                            DYNAMODB_USERSTABLE: { Ref: 'UsersTable' },
                            DEFAULT_USER_POOL_JWKS_PARAM: { Ref: 'DefaultUserPoolJwksUrl' },
                            SETTINGS_TABLE: { Ref: 'SettingsTable' },
                            EMBEDDINGS_API: { Ref: 'EmbeddingsApi' },
                            EMBEDDINGS_LAMBDA_ARN: { Ref: 'EmbeddingsLambdaArn' },
                            LLM_API: { Ref: 'LLMApi' },
                            LLM_LAMBDA_ARN: { Ref: 'LLMLambdaArn' },
                            ...util.getCommonEnvironmentVariables(),
                        },
                    ],
                },
            },
            Handler: 'index.handler',
            LoggingConfig: {
                LogGroup: { Ref: 'FulfillmentLambdaLogGroup' },
            },
            Layers: [
                { Ref: 'AwsSdkLayerLambdaLayer' },
                { Ref: 'CommonModulesLambdaLayer' },
                { Ref: 'EsProxyLambdaLayer' },
                { Ref: 'QnABotCommonLambdaLayer' },
            ],
            MemorySize: 1408,
            Role: { 'Fn::GetAtt': ['FulfillmentLambdaRole', 'Arn'] },
            Runtime: process.env.npm_package_config_lambdaRuntime,
            Timeout: 300,
            TracingConfig: {
                Mode: {
                    'Fn::If': [
                        'XRAYEnabled',
                        'Active',
                        'PassThrough',
                    ],
                },
            },
            Tags: [
                {
                    Key: 'Type',
                    Value: 'Fulfillment',
                },
            ],
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
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W89', 'W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    },
    FulfillmentLambdaVersionGenerator: {
        Type: 'Custom::LambdaVersion',
        // this custom resource takes no action on deletes as we keep all versions
        // the lambda versions will be deleted along with it's parent Lambda Function
        // setting DeletionPolicy of Retain to prevent CFNLambda failures on rollbacks to old versions
        DeletionPolicy: 'Retain',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            FunctionName: { Ref: 'FulfillmentLambda' },
            Triggers: { // The set of triggers to kick off a Custom Resource Update event
                FulfillmentCodeVersionTrigger: [
                    { Ref: 'FulfillmentCodeVersion' },
                ],
                LayersTrigger: [
                    { Ref: 'AwsSdkLayerLambdaLayer' },
                    { Ref: 'CommonModulesLambdaLayer' },
                    { Ref: 'EsProxyLambdaLayer' },
                    { Ref: 'QnABotCommonLambdaLayer' },
                ],
                EmbeddingsTrigger: [
                    { Ref: 'EmbeddingsApi' },
                    { Ref: 'EmbeddingsLambdaArn' },
                ],
                QASummarizeTrigger: [
                    { Ref: 'LLMApi' },
                    { Ref: 'LLMLambdaArn' },
                ],
            },
        },
    },
    FulfillmentLambdaAliaslive: {
        Type: 'AWS::Lambda::Alias',
        DependsOn: 'FulfillmentLambdaVersionGenerator',
        Properties: {
            FunctionName: { Ref: 'FulfillmentLambda' },
            FunctionVersion: { 'Fn::GetAtt': ['FulfillmentLambdaVersionGenerator', 'Version'] },
            Name: 'live',
            ProvisionedConcurrencyConfig: {
                'Fn::If': [
                    'CreateConcurrency',
                    { ProvisionedConcurrentExecutions: { Ref: 'FulfillmentConcurrency' } },
                    { Ref: 'AWS::NoValue' },
                ],
            },
        },
    },
    InvokePolicy: {
        Type: 'AWS::IAM::ManagedPolicy',
        Properties: {
            PolicyDocument: {
                'Fn::If': [
                    'BuildExamples',
                    {
                        Version: '2012-10-17',
                        Statement: [{
                            Effect: 'Allow',
                            Action: [
                                'lambda:InvokeFunction',
                            ],
                            Resource: [
                                'arn:aws:lambda:*:*:function:qna-*',
                                'arn:aws:lambda:*:*:function:QNA-*',
                                { 'Fn::GetAtt': ['ESQueryLambda', 'Arn'] },
                                { 'Fn::GetAtt': ['ESProxyLambda', 'Arn'] },
                                { 'Fn::GetAtt': ['ESLoggingLambda', 'Arn'] },
                                { 'Fn::GetAtt': ['ESQidLambda', 'Arn'] },
                                { 'Fn::If': ['EmbeddingsLambdaArn', { Ref: 'EmbeddingsLambdaArn' }, { Ref: 'AWS::NoValue' }] },
                                { 'Fn::If': ['LLMLambdaArn', { Ref: 'LLMLambdaArn' }, { Ref: 'AWS::NoValue' }] },
                            ].concat(require('../../examples/outputs').names
                                .map((x) => ({ 'Fn::GetAtt': ['ExamplesStack', `Outputs.${x}`] }))),
                        }],
                    },
                    {
                        Version: '2012-10-17',
                        Statement: [{
                            Effect: 'Allow',
                            Action: [
                                'lambda:InvokeFunction',
                            ],
                            Resource: [
                                'arn:aws:lambda:*:*:function:qna-*',
                                'arn:aws:lambda:*:*:function:QNA-*',
                                { 'Fn::GetAtt': ['ESQueryLambda', 'Arn'] },
                                { 'Fn::GetAtt': ['ESProxyLambda', 'Arn'] },
                                { 'Fn::GetAtt': ['ESLoggingLambda', 'Arn'] },
                                { 'Fn::GetAtt': ['ESQidLambda', 'Arn'] },
                                { 'Fn::If': ['EmbeddingsLambdaArn', { Ref: 'EmbeddingsLambdaArn' }, { Ref: 'AWS::NoValue' }] },
                                { 'Fn::If': ['LLMLambdaArn', { Ref: 'LLMLambdaArn' }, { Ref: 'AWS::NoValue' }] },
                            ],
                        }],
                    },
                ],
            },
            Roles: [{ Ref: 'FulfillmentLambdaRole' }],
        },
    },
    LexBotPolicy: {
        Type: 'AWS::IAM::ManagedPolicy',
        Properties: {
            PolicyDocument: {
                Version: '2012-10-17',
                Statement: [{
                    Effect: 'Allow',
                    Action: [
                        'lex:RecognizeText',
                    ],
                    Resource: [
                        'arn:aws:lex:*:*:bot:QNA*',
                        'arn:aws:lex:*:*:bot*',
                    ],
                }],
            },
            Roles: [{ Ref: 'FulfillmentLambdaRole' }],
        },
        Metadata: {
            guard: util.cfnGuard('IAM_POLICY_NON_COMPLIANT_ARN'),
        },
    },
    FulfillmentLambdaRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'lambda.amazonaws.com',
                        },
                        Action: 'sts:AssumeRole',
                    },
                ],
            },
            Path: '/',
            ManagedPolicyArns: [
                { Ref: 'QueryPolicy' },
            ],
            Policies: [
                util.basicLambdaExecutionPolicy(),
                util.lambdaVPCAccessExecutionRole(),
                util.xrayDaemonWriteAccess(),
                util.translateReadOnly(),
                util.comprehendReadOnly(),
                util.streamingPermissions(),
                {
                    PolicyName: 'ParamStorePolicy',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [{
                            Effect: 'Allow',
                            Action: [
                                'ssm:GetParameter',
                                'ssm:GetParameters',
                            ],
                            Resource: [
                                {
                                    'Fn::Join': [
                                        '', [
                                            'arn:aws:ssm:',
                                            { 'Fn::Sub': '${AWS::Region}:' },
                                            { 'Fn::Sub': '${AWS::AccountId}:' },
                                            'parameter/',
                                            { Ref: 'DefaultUserPoolJwksUrl' },
                                        ],
                                    ],
                                },
                            ],
                        }],
                    },
                },
                {
                    PolicyName: 'DynamoDBPolicy',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [{
                            Effect: 'Allow',
                            Action: [
                                'dynamodb:GetItem',
                                'dynamodb:PutItem',
                            ],
                            Resource: [
                                { 'Fn::GetAtt': ['UsersTable', 'Arn'] },
                            ],
                        }],
                    },
                },
                {
                    'Fn::If': [
                        'BedrockEnable',
                        {
                            PolicyName: 'BedrockInvokeModelAccess',
                            PolicyDocument: {
                                Version: '2012-10-17',
                                Statement: [
                                    {
                                        Effect: 'Allow',
                                        Action: [
                                            'bedrock:InvokeModel',
                                            'bedrock:InvokeModelWithResponseStream'
                                        ],
                                        Resource: [
                                            { 'Fn::If': ['EmbeddingsBedrock', { 'Fn::Sub': ['arn:${AWS::Partition}:bedrock:${AWS::Region}::foundation-model/${ModelId}', {ModelId: { 'Fn::FindInMap': ['BedrockDefaults', {Ref : 'EmbeddingsBedrockModelId'}, 'ModelID'] }}] }, { Ref: 'AWS::NoValue' }] },
                                            { 'Fn::If': ['LLMBedrock', { 'Fn::Sub': ['arn:${AWS::Partition}:bedrock:${AWS::Region}::foundation-model/${ModelId}', {ModelId: { 'Fn::FindInMap': ['BedrockDefaults', {Ref : 'LLMBedrockModelId'}, 'ModelID'] }}] }, { Ref: 'AWS::NoValue' }] },
                                            { 'Fn::If': ['BedrockKnowledgeBaseEnable', { 'Fn::Sub': ['arn:${AWS::Partition}:bedrock:${AWS::Region}::foundation-model/${ModelId}', {ModelId: { 'Fn::FindInMap': ['BedrockDefaults', {Ref : 'BedrockKnowledgeBaseModel'}, 'ModelID'] }}] }, { Ref: 'AWS::NoValue' }] },
                                        ],
                                    },
                                    {
                                        Sid: 'ApplyGuardrailsToLLMBedrock', // https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-permissions.html#guardrails-permissions-invoke
                                        Effect: 'Allow',
                                        Action: [
                                            'bedrock:ApplyGuardrail',
                                        ],
                                        Resource: [{ 'Fn::Sub': 'arn:${AWS::Partition}:bedrock:${AWS::Region}:${AWS::AccountId}:guardrail/*' }],
                                    },
                                ],
                            },
                        },
                        { Ref: 'AWS::NoValue' },
                    ],
                },
                {
                    'Fn::If': [
                        'BedrockKnowledgeBaseEnable',
                        {
                            PolicyName: 'BedrockKnowledgeBaseAccess',
                            PolicyDocument: {
                                Version: '2012-10-17',
                                Statement: [
                                    {
                                        Effect: 'Allow',
                                        Action: [
                                            'bedrock:Retrieve',
                                            'bedrock:RetrieveAndGenerate',
                                        ],
                                        Resource: { 'Fn::Sub': 'arn:${AWS::Partition}:bedrock:${AWS::Region}:${AWS::AccountId}:knowledge-base/${BedrockKnowledgeBaseId}' },
                                    },
                                    {
                                        Sid: 'ApplyGuardrailsToKnowledgeBase', // https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-permissions.html#guardrails-permissions-invoke
                                        Effect: 'Allow',
                                        Action: [
                                            'bedrock:ApplyGuardrail',
                                        ],
                                        Resource: [{ 'Fn::Sub': 'arn:${AWS::Partition}:bedrock:${AWS::Region}:${AWS::AccountId}:guardrail/*' }],
                                    },
                                ],
                            },
                        },
                        { Ref: 'AWS::NoValue' },
                    ],
                },
                {
                    PolicyName: 'S3QNABucketReadAccess',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Action: [
                                    's3:GetObject',
                                ],
                                Resource: [
                                    'arn:aws:s3:::QNA*/*',
                                    'arn:aws:s3:::qna*/*',
                                ],
                            },
                        ],
                    },
                },
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
                                Resource: [{ 'Fn::GetAtt': ['SettingsTable', 'Arn'] }],
                            },
                        ],
                    },
                }
            ],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W11', 'W12']),
            guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK'),
        },
    },
    ESWarmerCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/warmer.zip' },
            BuildDate: (new Date()).toISOString(),
        },
    },
    ESWarmerLambdaLogGroup: {
        Type: 'AWS::Logs::LogGroup',
        Properties: {
            LogGroupName: {
                'Fn::Join': [
                    '-',
                    [
                        { 'Fn::Sub': '/aws/lambda/${AWS::StackName}-ESWarmerLambda' },
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
    ESWarmerLambda: {
        DependsOn: ['ESWarmerCodeVersion'],
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/warmer.zip' },
                S3ObjectVersion: { Ref: 'ESWarmerCodeVersion' },
            },
            Environment: {
                Variables: {
                    REPEAT_COUNT: '4',
                    TARGET_PATH: '_search',
                    TARGET_INDEX: { 'Fn::GetAtt': ['Var', 'QnaIndex'] },
                    TARGET_URL: { 'Fn::GetAtt': ['ESVar', 'ESAddress'] },
                    SETTINGS_TABLE: { Ref: 'SettingsTable' },
                    ...util.getCommonEnvironmentVariables(),
                },
            },
            Handler: 'index.warmer',
            LoggingConfig: {
                LogGroup: { Ref: 'ESWarmerLambdaLogGroup' },
            },
            MemorySize: '512',
            Role: { 'Fn::GetAtt': ['WarmerLambdaRole', 'Arn'] },
            Runtime: process.env.npm_package_config_lambdaRuntime,
            Timeout: 300,
            Layers: [
                { Ref: 'AwsSdkLayerLambdaLayer' },
                { Ref: 'CommonModulesLambdaLayer' },
                { Ref: 'EsProxyLambdaLayer' },
                { Ref: 'QnABotCommonLambdaLayer' },
            ],
            VpcConfig: {
                'Fn::If': ['VPCEnabled', {
                    SubnetIds: { Ref: 'VPCSubnetIdList' },
                    SecurityGroupIds: { Ref: 'VPCSecurityGroupIdList' },
                }, { Ref: 'AWS::NoValue' }],
            },
            TracingConfig: {
                'Fn::If': ['XRAYEnabled', { Mode: 'Active' },
                    { Ref: 'AWS::NoValue' }],
            },
            Tags: [{
                Key: 'Type',
                Value: 'Warmer',
            }],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    },
    WarmerLambdaRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'lambda.amazonaws.com',
                        },
                        Action: 'sts:AssumeRole',
                    },
                ],
            },
            Path: '/',
            Policies: [
                util.basicLambdaExecutionPolicy(),
                util.lambdaVPCAccessExecutionRole(),
                util.xrayDaemonWriteAccess(),
                {
                    PolicyName: 'ParamStorePolicy',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                        {
                            Sid: 'AllowES',
                            Effect: 'Allow',
                            Action: [
                                'es:ESHttpGet',
                            ],
                            Resource: [
                                '*',
                            ], // these actions cannot be bound to resources other than *
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
    ESWarmerRule: {
        Type: 'AWS::Events::Rule',
        Properties: {
            ScheduleExpression: 'rate(1 minute)',
            Targets: [
                {
                    Id: 'ESWarmerScheduler',
                    Arn: {
                        'Fn::GetAtt': [
                            'ESWarmerLambda',
                            'Arn',
                        ],
                    },
                },
            ],
        },
    },
    ESWarmerRuleInvokeLambdaPermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            FunctionName: {
                'Fn::GetAtt': [
                    'ESWarmerLambda',
                    'Arn',
                ],
            },
            Action: 'lambda:InvokeFunction',
            Principal: 'events.amazonaws.com',
            SourceArn: {
                'Fn::GetAtt': [
                    'ESWarmerRule',
                    'Arn',
                ],
            },
        },
    },
};
