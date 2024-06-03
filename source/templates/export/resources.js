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

/* eslint-disable indent */
/* eslint-disable quotes */
const fs = require('fs');
const util = require('../util');

module.exports = {
    ExportCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { Ref: 'CFNLambda' },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/export.zip' },
            BuildDate: new Date().toISOString(),
        },
    },
    ConnectCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { Ref: 'CFNLambda' },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/connect.zip' },
            BuildDate: new Date().toISOString(),
        },
    },
    ConnectLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/connect.zip' },
                S3ObjectVersion: { Ref: 'ConnectCodeVersion' },
            },
            Environment: {
                Variables: {
                    outputBucket: { Ref: 'ExportBucket' },
                    s3Prefix: 'connect/',
                    accountId: { Ref: 'AWS::AccountId' },
                    region: { Ref: 'AWS::Region' },
                    LexVersion: { Ref: 'LexVersion' },
                    // Lex V1
                    fallBackIntent: { Ref: 'FallbackIntent' },
                    intent: { Ref: 'Intent' },
                    lexBot: { Ref: 'BotName' },
                    // Lex V2
                    LexV2BotName: { Ref: 'LexV2BotName' },
                    LexV2BotId: { Ref: 'LexV2BotId' },
                    LexV2BotAlias: { Ref: 'LexV2BotAlias' },
                    LexV2BotAliasId: { Ref: 'LexV2BotAliasId' },
                    LexV2BotLocaleIds: { Ref: 'LexV2BotLocaleIds' },
                },
            },
            Handler: 'index.handler',
            MemorySize: '1024',
            Role: { 'Fn::GetAtt': ['ExportRole', 'Arn'] },
            Runtime: process.env.npm_package_config_lambdaRuntime,
            Timeout: 300,
            VpcConfig: {
                'Fn::If': [
                    'VPCEnabled',
                    {
                        SubnetIds: { 'Fn::Split': [',', { Ref: 'VPCSubnetIdList' }] },
                        SecurityGroupIds: { 'Fn::Split': [',', { Ref: 'VPCSecurityGroupIdList' }] },
                    },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            TracingConfig: {
                'Fn::If': ['XRAYEnabled', { Mode: 'Active' }, { Ref: 'AWS::NoValue' }],
            },
            Layers: [{ Ref: 'AwsSdkLayerLambdaLayer' }],
            Tags: [
                {
                    Key: 'Type',
                    Value: 'Export',
                },
            ],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    },
    ConnectApiResource: {
        Type: 'AWS::ApiGateway::Resource',
        Properties: {
            ParentId: { Ref: 'ApiRootResourceId' },
            PathPart: 'connect',
            RestApiId: { Ref: 'Api' },
        },
    },
    InvokePermissionConnectLambda: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            Action: 'lambda:InvokeFunction',
            FunctionName: { 'Fn::GetAtt': ['ConnectLambda', 'Arn'] },
            Principal: 'apigateway.amazonaws.com',
            SourceAccount: { Ref: 'AWS::AccountId' }, 
        },
    },
    GenesysCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { Ref: 'CFNLambda' },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/genesys.zip' },
            BuildDate: new Date().toISOString(),
        },
    },
    GenesysLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/genesys.zip' },
                S3ObjectVersion: { Ref: 'GenesysCodeVersion' },
            },
            Environment: {
                Variables: {
                    outputBucket: { Ref: 'ExportBucket' },
                    s3Prefix: 'genesys/',
                    accountId: { Ref: 'AWS::AccountId' },
                    region: { Ref: 'AWS::Region' },
                    LexVersion: { Ref: 'LexVersion' },
                    // Lex V1
                    fallBackIntent: { Ref: 'FallbackIntent' },
                    intent: { Ref: 'Intent' },
                    lexBot: { Ref: 'BotName' },
                    // Lex V2
                    LexV2BotName: { Ref: 'LexV2BotName' },
                    LexV2BotId: { Ref: 'LexV2BotId' },
                    LexV2BotAlias: { Ref: 'LexV2BotAlias' },
                    LexV2BotAliasId: { Ref: 'LexV2BotAliasId' },
                    LexV2BotLocaleIds: { Ref: 'LexV2BotLocaleIds' },
                },
            },
            Handler: 'index.handler',
            MemorySize: '1024',
            Role: { 'Fn::GetAtt': ['ExportRole', 'Arn'] },
            Runtime: process.env.npm_package_config_lambdaRuntime,
            Timeout: 300,
            VpcConfig: {
                'Fn::If': [
                    'VPCEnabled',
                    {
                        SubnetIds: { 'Fn::Split': [',', { Ref: 'VPCSubnetIdList' }] },
                        SecurityGroupIds: { 'Fn::Split': [',', { Ref: 'VPCSecurityGroupIdList' }] },
                    },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            TracingConfig: {
                'Fn::If': ['XRAYEnabled', { Mode: 'Active' }, { Ref: 'AWS::NoValue' }],
            },
            Layers: [{ Ref: 'AwsSdkLayerLambdaLayer' }],
            Tags: [
                {
                    Key: 'Type',
                    Value: 'Export',
                },
            ],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    },
    GenesysApiResource: {
        Type: 'AWS::ApiGateway::Resource',
        Properties: {
            ParentId: { Ref: 'ApiRootResourceId' },
            PathPart: 'genesys',
            RestApiId: { Ref: 'Api' },
        },
    },
    InvokePermissionGenesysLambda: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            Action: 'lambda:InvokeFunction',
            FunctionName: { 'Fn::GetAtt': ['GenesysLambda', 'Arn'] },
            Principal: 'apigateway.amazonaws.com',
            SourceAccount: { Ref: 'AWS::AccountId' }, 
        },
    },
    Deployment: {
        Type: 'Custom::ApiDeployment',
        DeletionPolicy: 'Retain',
        DependsOn: [
            'ConnectGet',
            'ConnectApiResource',
            'InvokePermissionConnectLambda',
            'GenesysGet',
            'GenesysApiResource',
            'InvokePermissionGenesysLambda',
            'TranslatePost',
            'TranslateApiResource',
            'TranslateApiRootResource',
            'KendraNativeCrawlerPost',
            'KendraNativeCrawlerApiResource',
            'InvokePermissionTranslateLambda',
            'KendraNativeCrawlerGet',
        ],
        Properties: {
            ServiceToken: { Ref: 'CFNLambda' },
            restApiId: { Ref: 'Api' },
            buildDate: new Date(),
            stage: { Ref: 'Stage' },
            ApiDeploymentId: { Ref: 'ApiDeploymentId' },
        },
    },
    ConnectGet: {
        Type: 'AWS::ApiGateway::Method',
        Properties: {
            AuthorizationType: 'AWS_IAM',
            HttpMethod: 'GET',
            RestApiId: { Ref: 'Api' },
            ResourceId: { Ref: 'ConnectApiResource' },
            Integration: {
                Type: 'AWS',
                IntegrationHttpMethod: 'POST',
                Uri: {
                    'Fn::Join': [
                        '',
                        [
                            'arn:aws:apigateway:',
                            { Ref: 'AWS::Region' },
                            ':lambda:path/2015-03-31/functions/',
                            { 'Fn::GetAtt': ['ConnectLambda', 'Arn'] },
                            '/invocations',
                        ],
                    ],
                },
                IntegrationResponses: [
                    {
                        StatusCode: 200,
                    },
                ],
            },
            MethodResponses: [
                {
                    StatusCode: 200,
                },
            ],
        },
    },
    GenesysGet: {
        Type: 'AWS::ApiGateway::Method',
        Properties: {
            AuthorizationType: 'AWS_IAM',
            HttpMethod: 'GET',
            RestApiId: { Ref: 'Api' },
            ResourceId: { Ref: 'GenesysApiResource' },
            Integration: {
                Type: 'AWS',
                IntegrationHttpMethod: 'POST',
                Uri: {
                    'Fn::Join': [
                        '',
                        [
                            'arn:aws:apigateway:',
                            { Ref: 'AWS::Region' },
                            ':lambda:path/2015-03-31/functions/',
                            { 'Fn::GetAtt': ['GenesysLambda', 'Arn'] },
                            '/invocations',
                        ],
                    ],
                },
                IntegrationResponses: [
                    {
                        StatusCode: 200,
                    },
                ],
            },
            MethodResponses: [
                {
                    StatusCode: 200,
                },
            ],
        },
    },
    SyncCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { Ref: 'CFNLambda' },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/export.zip' },
            BuildDate: new Date().toISOString(),
        },
    },
    ExportStepLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/export.zip' },
                S3ObjectVersion: { Ref: 'ExportCodeVersion' },
            },
            Environment: {
                Variables: {
                    ES_INDEX: { Ref: 'VarIndex' },
                    ES_ENDPOINT: { Ref: 'EsEndpoint' },
                    ES_PROXY: { Ref: 'EsProxyLambda' },
                    ...util.getCommonEnvironmentVariables()
                },
            },
            Handler: 'index.step',
            MemorySize: '1024',
            Role: { 'Fn::GetAtt': ['ExportRole', 'Arn'] },
            Runtime: process.env.npm_package_config_lambdaRuntime,
            Timeout: 300,
            VpcConfig: {
                'Fn::If': [
                    'VPCEnabled',
                    {
                        SubnetIds: { 'Fn::Split': [',', { Ref: 'VPCSubnetIdList' }] },
                        SecurityGroupIds: { 'Fn::Split': [',', { Ref: 'VPCSecurityGroupIdList' }] },
                    },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            TracingConfig: {
                'Fn::If': ['XRAYEnabled', { Mode: 'Active' }, { Ref: 'AWS::NoValue' }],
            },
            Layers: [{ Ref: 'AwsSdkLayerLambdaLayer' }],
            Tags: [
                {
                    Key: 'Type',
                    Value: 'Export',
                },
            ],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    },
    ExportRole: {
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
            Policies: [
                util.basicLambdaExecutionPolicy(),
                util.lambdaVPCAccessExecutionRole(),
                util.xrayDaemonWriteAccess(),
            ],
            Path: '/',
            ManagedPolicyArns: [{ Ref: 'ExportPolicy' }],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W11', 'W12']),
            guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK'),
        },
    },
    ExportPolicy: {
        Type: 'AWS::IAM::ManagedPolicy',
        Properties: {
            PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: [
                            's3:PutObject',
                            's3:GetObject',
                            's3:DeleteObjectVersion',
                            's3:DeleteObject',
                            's3:GetObjectVersion',
                        ],
                        Resource: [{ 'Fn::Sub': 'arn:aws:s3:::${ExportBucket}*' }],
                    },
                    {
                        Effect: 'Allow',
                        Action: ['lambda:InvokeFunction'],
                        Resource: [{ Ref: 'EsProxyLambda' }],
                    },
                ],
            },
        },
    },
    ExportClean: {
        Type: 'Custom::S3Clean',
        DependsOn: ['ExportPolicy'],
        Properties: {
            ServiceToken: { Ref: 'S3Clean' },
            Bucket: { Ref: 'ExportBucket' },
        },
    },
    KendraSyncLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/export.zip' },
                S3ObjectVersion: { Ref: 'SyncCodeVersion' },
            },
            Environment: {
                Variables: {
                    DEFAULT_SETTINGS_PARAM: { Ref: 'DefaultQnABotSettings' },
                    PRIVATE_SETTINGS_PARAM: { Ref: 'PrivateQnABotSettings' },
                    CUSTOM_SETTINGS_PARAM: { Ref: 'CustomQnABotSettings' },
                    OUTPUT_S3_BUCKET: { Ref: 'ExportBucket' },
                    KENDRA_ROLE: { 'Fn::GetAtt': ['KendraS3Role', 'Arn'] },
                    REGION: { Ref: 'AWS::Region' },
                    ...util.getCommonEnvironmentVariables(),
                },
            },
            Layers: [{ Ref: 'AwsSdkLayerLambdaLayer' }, { Ref: 'QnABotCommonLambdaLayer' }],
            Handler: 'kendraSync.performSync',
            MemorySize: '1024',
            Role: { 'Fn::GetAtt': ['KendraSyncRole', 'Arn'] },
            Runtime: process.env.npm_package_config_lambdaRuntime,
            Timeout: 300,
            VpcConfig: {
                'Fn::If': [
                    'VPCEnabled',
                    {
                        SubnetIds: { 'Fn::Split': [',', { Ref: 'VPCSubnetIdList' }] },
                        SecurityGroupIds: { 'Fn::Split': [',', { Ref: 'VPCSecurityGroupIdList' }] },
                    },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            TracingConfig: {
                'Fn::If': ['XRAYEnabled', { Mode: 'Active' }, { Ref: 'AWS::NoValue' }],
            },
            Tags: [
                {
                    Key: 'Type',
                    Value: 'Sync',
                },
            ],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    },
    KendraSyncRole: {
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
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'kendra.amazonaws.com',
                        },
                        Action: 'sts:AssumeRole',
                    },
                ],
            },
            Policies: [
                util.basicLambdaExecutionPolicy(),
                util.lambdaVPCAccessExecutionRole(),
                util.xrayDaemonWriteAccess(),
            ],
            Path: '/',
            ManagedPolicyArns: [{ 'Fn::If': ['CreateKendraSyncPolicy', { Ref: 'KendraSyncPolicy' }, { Ref: 'AWS::NoValue' }] }],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W11', 'W12']),
            guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK'),
        },
    },
    KendraSyncPolicy: {
        Type: 'AWS::IAM::ManagedPolicy',
        Condition: 'CreateKendraSyncPolicy',
        Properties: {
            PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: [
                            's3:PutObject',
                            's3:Get*',
                            's3:List*',
                        ],
                        Resource: [
                            { 'Fn::Sub': 'arn:aws:s3:::${ExportBucket}' },
                            { 'Fn::Sub': 'arn:aws:s3:::${ExportBucket}/*' },
                        ],
                    },
                    {
                        Effect: 'Allow',
                        Action: [
                            'iam:passRole',
                        ],
                        Resource: [
                            { 'Fn::GetAtt': ['KendraS3Role', 'Arn'] },
                        ],
                    },
                    {
                        Effect: 'Allow',
                        Action: [
                            'ssm:getParameter',
                        ],
                        Resource: [
                            { 'Fn::Sub': 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:*' },
                        ],
                    },
                    {
                        Effect: 'Allow',
                        Action: [
                            'kendra:CreateFaq',
                            'kendra:ListFaqs',
                            'kendra:TagResource',
                            'kendra:DeleteFaq',
                            'kendra:DescribeFaq',
                            'kendra:DetectPiiEntities',
                        ],
                        Resource: [
                            { 'Fn::Sub': 'arn:aws:kendra:${AWS::Region}:${AWS::AccountId}:index/${KendraFaqIndexId}' },
                            { 'Fn::Sub': 'arn:aws:kendra:${AWS::Region}:${AWS::AccountId}:index/${KendraFaqIndexId}/faq/*' },
                        ],
                    },
                ],
            },
        },
    },
    KendraS3Role: {
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
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'kendra.amazonaws.com',
                        },
                        Action: 'sts:AssumeRole',
                    },
                ],
            },
            Policies: [
                util.basicLambdaExecutionPolicy(),
                util.lambdaVPCAccessExecutionRole(),
                util.xrayDaemonWriteAccess(),
            ],
            Path: '/',
            ManagedPolicyArns: [{ 'Fn::If': ['CreateKendraSyncPolicy', { Ref: 'KendraS3Policy' }, { Ref: 'AWS::NoValue' }] }],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W11', 'W12']),
            guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK'),
        },
    },
    TranslatePost: {
        Type: 'AWS::ApiGateway::Method',
        Properties: {
            AuthorizationType: 'AWS_IAM',
            HttpMethod: 'POST',
            RestApiId: { Ref: 'Api' },
            ResourceId: { Ref: 'TranslateApiResource' },
            Integration: {
                Type: 'AWS_PROXY',
                IntegrationHttpMethod: 'POST',
                RequestTemplates: {
                    'application/x-www-form-urlencoded': '{"body":$input.json(\'$\')}',
                },
                Uri: {
                    'Fn::Join': [
                        '',
                        [
                            'arn:aws:apigateway:',
                            { Ref: 'AWS::Region' },
                            ':lambda:path/2015-03-31/functions/',
                            { 'Fn::GetAtt': ['TranslateLambda', 'Arn'] },
                            '/invocations',
                        ],
                    ],
                },
                IntegrationResponses: [
                    {
                        StatusCode: 200,
                    },
                ],
            },
            MethodResponses: [
                {
                    StatusCode: 200,
                },
            ],
        },
    },
    TranslateRole: {
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
            Policies: [util.basicLambdaExecutionPolicy(), util.lambdaVPCAccessExecutionRole()],
            ManagedPolicyArns: [{ Ref: 'TranslatePolicy' }],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W11']),
            guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK'),
        },
    },
    TranslateCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { Ref: 'CFNLambda' },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/translate.zip' },
            BuildDate: new Date().toISOString(),
        },
    },
    TranslateLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/translate.zip' },
                S3ObjectVersion: { Ref: 'TranslateCodeVersion' },
            },
            Environment: {
                Variables: {
                    outputBucket: { Ref: 'ExportBucket' },
                    ...util.getCommonEnvironmentVariables()
                },
            },
            Handler: 'index.handler',
            MemorySize: '1024',
            Role: { 'Fn::GetAtt': ['TranslateRole', 'Arn'] },
            Runtime: process.env.npm_package_config_lambdaRuntime,
            Timeout: 300,
            VpcConfig: {
                'Fn::If': [
                    'VPCEnabled',
                    {
                        SubnetIds: { 'Fn::Split': [',', { Ref: 'VPCSubnetIdList' }] },
                        SecurityGroupIds: { 'Fn::Split': [',', { Ref: 'VPCSecurityGroupIdList' }] },
                    },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            TracingConfig: {
                'Fn::If': ['XRAYEnabled', { Mode: 'Active' }, { Ref: 'AWS::NoValue' }],
            },
            Layers: [{ Ref: 'AwsSdkLayerLambdaLayer' }],
            Tags: [
                {
                    Key: 'Type',
                    Value: 'Export',
                },
            ],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    },
    TranslatePolicy: {
        Type: 'AWS::IAM::ManagedPolicy',
        Properties: {
            PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: ['translate:ImportTerminology', 'translate:ListTerminologies'],
                        Resource: ['*'], // these actions cannot be bound to resources other than *
                    },
                ],
            },
        },
        Metadata: { cfn_nag: util.cfnNag(['W13']) },
    },
    TranslateApiRootResource: {
        Type: 'AWS::ApiGateway::Resource',
        Properties: {
            ParentId: { Ref: 'ApiRootResourceId' },
            PathPart: 'translate',
            RestApiId: { Ref: 'Api' },
        },
    },
    TranslateApiResource: {
        Type: 'AWS::ApiGateway::Resource',
        Properties: {
            ParentId: { Ref: 'TranslateApiRootResource' },
            PathPart: '{proxy+}',
            RestApiId: { Ref: 'Api' },
        },
    },
    InvokePermissionTranslateLambda: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            Action: 'lambda:InvokeFunction',
            FunctionName: { 'Fn::GetAtt': ['TranslateLambda', 'Arn'] },
            Principal: 'apigateway.amazonaws.com',
            SourceAccount: { Ref: 'AWS::AccountId' }, 
        },
    },

    KendraTopicApiGateRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: ['apigateway.amazonaws.com'],
                        },
                        Action: ['sts:AssumeRole'],
                    },
                ],
            },
            Path: '/',
            Policies: [
                {
                    PolicyName: 'GatewayRolePolicy',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Action: ['sns:Publish'],
                                Resource: { Ref: 'KendraCrawlerSnsTopic' },
                            },
                            {
                                Effect: 'Allow',
                                Action: ['logs:PutLogEvents', 'logs:CreateLogGroup', 'logs:CreateLogStream'],
                                Resource: [
                                    {
                                        'Fn::Sub':
                                            'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:*',
                                    },
                                    {
                                        'Fn::Sub':
                                            'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:*:log-stream:*',
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W11']),
            guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK'),
        },
    },

    ParameterChangeRuleKendraCrawlerPermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            FunctionName: {
                'Fn::GetAtt': ['KendraNativeCrawlerScheduleUpdateLambda', 'Arn'],
            },
            Action: 'lambda:InvokeFunction',
            Principal: 'events.amazonaws.com',
            SourceArn: {
                'Fn::GetAtt': ['CloudWatchEventRule', 'Arn'],
            },
        },
    },
    CloudWatchEventRule: {
        Type: 'AWS::Events::Rule',
        Properties: {
            Description: 'Parameter Setting Change',
            EventPattern: {
                source: ['aws.ssm'],
                'detail-type': ['Parameter Store Change'],
                detail: {
                    name: [{ Ref: 'CustomQnABotSettings' }],
                    operation: ['Update'],
                },
            },
            State: 'ENABLED',
            Targets: [
                // Add Lambda targets here as needed
                {
                    Arn: {
                        'Fn::GetAtt': ['KendraNativeCrawlerScheduleUpdateLambda', 'Arn'],
                    },
                    Id: 'KendraCrawler',
                },
            ],
        },
    },

    KendraNativeCrawlerRole: {
        Type: 'AWS::IAM::Role',
        Metadata: { guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK') },
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
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'kendra.amazonaws.com',
                        },
                        Action: 'sts:AssumeRole',
                    },
                ],
            },
            Path: '/',
            ManagedPolicyArns: [
                'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
                'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
                { Ref: 'KendraNativeCrawlerPolicy' },
            ],
        },
    },
    KendraS3Policy: {
        Type: 'AWS::IAM::ManagedPolicy',
        Condition: 'CreateKendraSyncPolicy',
        Properties: {
            PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: ['s3:GetObject'],
                        Resource: [
                            { 'Fn::Sub': 'arn:aws:s3:::${ExportBucket}' },
                            { 'Fn::Sub': 'arn:aws:s3:::${ExportBucket}/*' },
                        ],
                    },
                    {
                        Effect: 'Allow',
                        Action: ['kendra:CreateFaq'],
                        Resource: [
                            { 'Fn::Sub': 'arn:aws:kendra:${AWS::Region}:${AWS::AccountId}:index/${KendraFaqIndexId}' },
                        ],
                    },
                ],
            },
        },
    },
    KendraNativeCrawlerGet: {
        Type: 'AWS::ApiGateway::Method',
        Properties: {
            AuthorizationType: 'AWS_IAM',
            HttpMethod: 'GET',
            RestApiId: { Ref: 'Api' },
            ResourceId: { Ref: 'KendraNativeCrawlerApiResource' },
            Integration: {
                Type: 'AWS',
                IntegrationHttpMethod: 'POST',
                Uri: {
                    'Fn::Join': [
                        '',
                        [
                            'arn:aws:apigateway:',
                            { Ref: 'AWS::Region' },
                            ':lambda:path/2015-03-31/functions/',
                            { 'Fn::GetAtt': ['KendraNativeCrawlerStatusLambda', 'Arn'] },
                            '/invocations',
                        ],
                    ],
                },
                IntegrationResponses: [
                    {
                        StatusCode: 200,
                    },
                    {
                        StatusCode: 400,
                        ResponseTemplates: {
                            'application/xml': JSON.stringify({
                                error: 'Bad Request',
                            }),
                          },
                        SelectionPattern: 'Exception.*',
                    },
                ],
            },
            MethodResponses: [
                {
                    StatusCode: 200,
                },
                { 
                    StatusCode: 400 
                },
            ],
        },
    },
    KendraNativeCrawlerPost: {
        Type: 'AWS::ApiGateway::Method',
        Properties: {
            AuthorizationType: 'AWS_IAM',
            HttpMethod: 'POST',
            RestApiId: { Ref: 'Api' },
            ResourceId: { Ref: 'KendraNativeCrawlerApiResource' },
            Integration: {
                Type: 'AWS',
                IntegrationHttpMethod: 'POST',
                RequestParameters: {
                    'integration.request.header.X-Amz-Invocation-Type': "'Event'",
                },
                Uri: {
                    'Fn::Join': [
                        '',
                        [
                            'arn:aws:apigateway:',
                            { Ref: 'AWS::Region' },
                            ':lambda:path/2015-03-31/functions/',
                            { 'Fn::GetAtt': ['KendraNativeCrawlerLambda', 'Arn'] },
                            '/invocations',
                        ],
                    ],
                },
                IntegrationResponses: [
                    {
                        StatusCode: 200,
                    },
                    {
                        StatusCode: 400,
                        ResponseTemplates: {
                            'application/xml': JSON.stringify({
                                error: 'Bad Request',
                            }),
                        },
                        SelectionPattern: 'Exception.*',
                    },
                ],
            },
            MethodResponses: [
                {
                    StatusCode: 200,
                },
                { 
                    StatusCode: 400 
                },
            ],
        },
    },
    KendraNativeCrawlerCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { Ref: 'CFNLambda' },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/kendra-webcrawler.zip' },
            BuildDate: new Date().toISOString(),
        },
    },
    KendraNativeCrawlerStatusCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { Ref: 'CFNLambda' },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/kendra-webcrawler-status.zip' },
            BuildDate: new Date().toISOString(),
        },
    },
    KendraNativeCrawlerApiResource: {
        Type: 'AWS::ApiGateway::Resource',
        Properties: {
            ParentId: { Ref: 'ApiRootResourceId' },
            PathPart: 'kendranativecrawler',
            RestApiId: { Ref: 'Api' },
        },
    },
    KendraNativeCrawlerInvokePermissionConnectLambda: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            Action: 'lambda:InvokeFunction',
            FunctionName: { 'Fn::GetAtt': ['KendraNativeCrawlerLambda', 'Arn'] },
            Principal: 'apigateway.amazonaws.com',
            SourceAccount: { Ref: 'AWS::AccountId' }, 
        },
    },
    KendraNativeCrawlerLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/kendra-webcrawler.zip' },
                S3ObjectVersion: { Ref: 'KendraNativeCrawlerCodeVersion' },
            },
            VpcConfig: {
                'Fn::If': [
                    'VPCEnabled',
                    {
                        SubnetIds: { 'Fn::Split': [',', { Ref: 'VPCSubnetIdList' }] },
                        SecurityGroupIds: { 'Fn::Split': [',', { Ref: 'VPCSecurityGroupIdList' }] },
                    },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            TracingConfig: {
                'Fn::If': ['XRAYEnabled', { Mode: 'Active' }, { Ref: 'AWS::NoValue' }],
            },
            Environment: {
                Variables: {
                    DEFAULT_SETTINGS_PARAM: { Ref: 'DefaultQnABotSettings' },
                    PRIVATE_SETTINGS_PARAM: { Ref: 'PrivateQnABotSettings' },
                    CUSTOM_SETTINGS_PARAM: { Ref: 'CustomQnABotSettings' },
                    ROLE_ARN: { 'Fn::GetAtt': ['KendraNativeCrawlerPassRole', 'Arn'] },
                    DATASOURCE_NAME: {
                        'Fn::Join': [
                            '-',
                            [
                                'QNABotKendraNativeCrawler',
                                {
                                    'Fn::Select': [2, { 'Fn::Split': ['-', { Ref: 'DefaultQnABotSettings' }] }],
                                },
                                'v2',
                            ],
                        ],
                    },
                    DASHBOARD_NAME: {
                        'Fn::Join': [
                            '-',
                            [
                                'QNABotKendraDashboard',
                                {
                                    'Fn::Select': [2, { 'Fn::Split': ['-', { Ref: 'DefaultQnABotSettings' }] }],
                                },
                                'v2',
                            ],
                        ],
                    },
                    ...util.getCommonEnvironmentVariables()
                },
            },
            Handler: 'kendra_webcrawler.handler',
            MemorySize: '2048',
            Role: { 'Fn::GetAtt': ['KendraNativeCrawlerRole', 'Arn'] },
            Runtime: process.env.npm_package_config_pythonRuntime,
            Timeout: 900,
            Tags: [
                {
                    Key: 'Type',
                    Value: 'Export',
                },
            ],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    },
    KendraNativeCrawlerLambdaStatusInvokePermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            Action: 'lambda:InvokeFunction',
            FunctionName: { 'Fn::GetAtt': ['KendraNativeCrawlerStatusLambda', 'Arn'] },
            Principal: 'apigateway.amazonaws.com',
            SourceAccount: { Ref: 'AWS::AccountId' }, 
        },
    },
    KendraNativeCrawlerScheduleUpdateCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { Ref: 'CFNLambda' },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/kendra-webcrawler-schedule-updater.zip' },
            BuildDate: new Date().toISOString(),
        },
    },
    KendraNativeCrawlerScheduleUpdateLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/kendra-webcrawler-schedule-updater.zip' },
                S3ObjectVersion: { Ref: 'KendraNativeCrawlerScheduleUpdateCodeVersion' },
            },
            VpcConfig: {
                'Fn::If': [
                    'VPCEnabled',
                    {
                        SubnetIds: { 'Fn::Split': [',', { Ref: 'VPCSubnetIdList' }] },
                        SecurityGroupIds: { 'Fn::Split': [',', { Ref: 'VPCSecurityGroupIdList' }] },
                    },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            TracingConfig: {
                'Fn::If': ['XRAYEnabled', { Mode: 'Active' }, { Ref: 'AWS::NoValue' }],
            },
            Environment: {
                Variables: {
                    ROLE_ARN: { 'Fn::GetAtt': ['KendraNativeCrawlerPassRole', 'Arn'] },
                    DEFAULT_SETTINGS_PARAM: { Ref: 'DefaultQnABotSettings' },
                    PRIVATE_SETTINGS_PARAM: { Ref: 'PrivateQnABotSettings' },
                    CUSTOM_SETTINGS_PARAM: { Ref: 'CustomQnABotSettings' },
                    DATASOURCE_NAME: {
                        'Fn::Join': [
                            '-',
                            [
                                'QNABotKendraNativeCrawler',
                                {
                                    'Fn::Select': [2, { 'Fn::Split': ['-', { Ref: 'DefaultQnABotSettings' }] }],
                                },
                                'v2',
                            ],
                        ],
                    },
                    ...util.getCommonEnvironmentVariables()
                },
            },
            Handler: 'kendra_webcrawler_schedule_updater.handler',
            MemorySize: '2048',
            Role: { 'Fn::GetAtt': ['KendraNativeCrawlerRole', 'Arn'] },
            Runtime: process.env.npm_package_config_pythonRuntime,
            Timeout: 900,
            Tags: [
                {
                    Key: 'Type',
                    Value: 'Export',
                },
            ],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    },
    KendraNativeCrawlerStatusLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/kendra-webcrawler-status.zip' },
                S3ObjectVersion: { Ref: 'KendraNativeCrawlerStatusCodeVersion' },
            },
            VpcConfig: {
                'Fn::If': [
                    'VPCEnabled',
                    {
                        SubnetIds: { 'Fn::Split': [',', { Ref: 'VPCSubnetIdList' }] },
                        SecurityGroupIds: { 'Fn::Split': [',', { Ref: 'VPCSecurityGroupIdList' }] },
                    },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            TracingConfig: {
                'Fn::If': ['XRAYEnabled', { Mode: 'Active' }, { Ref: 'AWS::NoValue' }],
            },
            Environment: {
                Variables: {
                    DEFAULT_SETTINGS_PARAM: { Ref: 'DefaultQnABotSettings' },
                    PRIVATE_SETTINGS_PARAM: { Ref: 'PrivateQnABotSettings' },
                    CUSTOM_SETTINGS_PARAM: { Ref: 'CustomQnABotSettings' },
                    DATASOURCE_NAME: {
                        'Fn::Join': [
                            '-',
                            [
                                'QNABotKendraNativeCrawler',
                                {
                                    'Fn::Select': [2, { 'Fn::Split': ['-', { Ref: 'DefaultQnABotSettings' }] }],
                                },
                                'v2',
                            ],
                        ],
                    },
                    DASHBOARD_NAME: {
                        'Fn::Join': [
                            '-',
                            [
                                'QNABotKendraDashboard',
                                {
                                    'Fn::Select': [2, { 'Fn::Split': ['-', { Ref: 'DefaultQnABotSettings' }] }],
                                },
                                'v2',
                            ],
                        ],
                    },
                    ...util.getCommonEnvironmentVariables()
                },
            },
            Handler: 'kendra_webcrawler_status.handler',
            MemorySize: '2048',
            Role: { 'Fn::GetAtt': ['KendraNativeCrawlerRole', 'Arn'] },
            Runtime: process.env.npm_package_config_pythonRuntime,
            Timeout: 900,
            Tags: [
                {
                    Key: 'Type',
                    Value: 'Export',
                },
            ],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    },
    KendraNativeCrawlerPassRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'KendraNativeCrawlerServicePrincipals',
                        Effect: 'Allow',
                        Principal: {
                            Service: [ 'kendra.amazonaws.com', 'lambda.amazonaws.com' ]
                        },
                        Action: 'sts:AssumeRole',
                    }
                ],
            },
            Path: '/',
            Policies: [util.basicLambdaExecutionPolicy(), util.lambdaVPCAccessExecutionRole()],
            ManagedPolicyArns: [{ 'Fn::If': ['CreateKendraCrawlerPolicy', { Ref: 'KendraNativeCrawlerPassPolicy' }, { Ref: 'AWS::NoValue' }] }],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W11']),
            guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK'),
        },
    },
    KendraNativeCrawlerPolicy: {
        Type: 'AWS::IAM::ManagedPolicy',
        Properties: {
            PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: 'cloudwatch:PutDashboard',
                        Resource: [{ 'Fn::Sub': 'arn:${AWS::Partition}:cloudwatch::${AWS::AccountId}:dashboard/QNA*' }],
                    },
                    {
                        'Fn::If': ['CreateKendraCrawlerPolicy', {
                            Effect: 'Allow',
                            Action: [
                                'kendra:ListDataSources',
                                'kendra:ListDataSourceSyncJobs',
                                'kendra:DescribeDataSource',
                                'kendra:CreateDataSource',
                                'kendra:StartDataSourceSyncJob',
                                'kendra:StopDataSourceSyncJob',
                                'kendra:UpdateDataSource',
                            ],
                            Resource: [
                                { 'Fn::Sub': 'arn:${AWS::Partition}:kendra:${AWS::Region}:${AWS::AccountId}:index/${KendraWebPageIndexId}' },
                                {
                                    'Fn::Sub':
                                        'arn:${AWS::Partition}:kendra:${AWS::Region}:${AWS::AccountId}:index/${KendraWebPageIndexId}/data-source/*',
                                },
                            ],
                        },
                        { Ref: 'AWS::NoValue' }],
                    },
                    {
                        Effect: 'Allow',
                        Action: ['ssm:GetParameter'],
                        Resource: [
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        'arn:aws:ssm:',
                                        { Ref: 'AWS::Region' },
                                        ':',
                                        { Ref: 'AWS::AccountId' },
                                        ':parameter/',
                                        { Ref: 'CustomQnABotSettings' },
                                    ],
                                ],
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        'arn:aws:ssm:',
                                        { Ref: 'AWS::Region' },
                                        ':',
                                        { Ref: 'AWS::AccountId' },
                                        ':parameter/',
                                        { Ref: 'DefaultQnABotSettings' },
                                    ],
                                ],
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        'arn:aws:ssm:',
                                        { Ref: 'AWS::Region' },
                                        ':',
                                        { Ref: 'AWS::AccountId' },
                                        ':parameter/',
                                        { Ref: 'PrivateQnABotSettings' },
                                    ],
                                ],
                            },
                        ],
                    },
                    {
                        Effect: 'Allow',
                        Action: 'iam:PassRole',
                        Resource: { 'Fn::GetAtt': ['KendraNativeCrawlerPassRole', 'Arn'] },
                    },
                ],
            },
        },
        Metadata: { cfn_nag: util.cfnNag(['W11']) },
    },
    KendraNativeCrawlerPassPolicy: {
        Type: 'AWS::IAM::ManagedPolicy',
        Condition: 'CreateKendraCrawlerPolicy',
        Properties: {
            PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: ['kendra:BatchPutDocument', 'kendra:BatchDeleteDocument'],
                        Resource: { 'Fn::Sub': 'arn:aws:kendra:${AWS::Region}:${AWS::AccountId}:index/${KendraWebPageIndexId}' },
                    },
                ],
            },
        },
    },
};
