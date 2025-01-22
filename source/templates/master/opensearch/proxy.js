/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const util = require('../../util');

module.exports = {
    ESCFNProxyLambdaLogGroup:{
        Type: 'AWS::Logs::LogGroup',
        Properties: {
            LogGroupName: {
                'Fn::Join': [
                    '-',
                    [
                        { 'Fn::Sub': '/aws/lambda/${AWS::StackName}-ESCFNProxyLambda' },
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
    ESCFNProxyLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/proxy-es.zip' },
                S3ObjectVersion: { Ref: 'ESProxyCodeVersion' },
            },
            Environment: {
                Variables: {
                    SETTINGS_TABLE: { Ref: 'SettingsTable' },
                    ...util.getCommonEnvironmentVariables(),
                },
            },
            Layers: [{ Ref: 'AwsSdkLayerLambdaLayer' },
                { Ref: 'CommonModulesLambdaLayer' },
                { Ref: 'CfnLambdaLayer' },
                { Ref: 'EsProxyLambdaLayer' },
                { Ref: 'QnABotCommonLambdaLayer' }],
            Handler: 'resource.handler',
            LoggingConfig: {
                LogGroup: { Ref: 'ESCFNProxyLambdaLogGroup' },
            },
            MemorySize: '1408',
            Role: { 'Fn::GetAtt': ['ESProxyLambdaRole', 'Arn'] },
            Runtime: process.env.npm_package_config_lambdaRuntime,
            Timeout: 300,
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
                Value: 'CustomResource',
            }],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    },
    MetricsIndex: {
        Type: 'Custom::ESProxy',
        DependsOn: ['OpensearchDomain'],
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['ESCFNProxyLambda', 'Arn'] },
            create: {
                index: { 'Fn::Sub': '${Var.MetricsIndex}' },
                endpoint: { 'Fn::GetAtt': ['ESVar', 'ESAddress'] },
                body: {
                    'Fn::Sub': JSON.stringify({
                        settings: { 'index.mapping.total_fields.limit': 2000 },
                    }),
                },
            },
        },
    },
    FeedbackIndex: {
        Type: 'Custom::ESProxy',
        DependsOn: ['OpensearchDomain'],
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['ESCFNProxyLambda', 'Arn'] },
            create: {
                index: { 'Fn::Sub': '${Var.FeedbackIndex}' },
                endpoint: { 'Fn::GetAtt': ['ESVar', 'ESAddress'] },
                body: {
                    'Fn::Sub': JSON.stringify({
                        settings: {},
                    }),
                },
            },
        },
    },
    Index: {
        Type: 'Custom::ESProxy',
        DependsOn: ['OpensearchDomain'],
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['ESCFNProxyLambda', 'Arn'] },
            create: {
                index: { 'Fn::Sub': '${Var.QnaIndex}' },
                endpoint: { 'Fn::GetAtt': ['ESVar', 'ESAddress'] },
                body: {
                    'Fn::Sub': [
                        JSON.stringify({
                            settings: require('./index_settings.js'),
                            mappings: require('./index_mappings.js'),
                        }),
                        {
                            EmbeddingsDimensions: {
                                'Fn::If': [
                                    'EmbeddingsEnable',
                                    {
                                        'Fn::If': [
                                            'EmbeddingsLambda',
                                            { Ref: 'EmbeddingsLambdaDimensions' },
                                            {
                                                'Fn::If': [
                                                    'EmbeddingsBedrock',
                                                    { 'Fn::FindInMap': ['BedrockDefaults', {Ref : 'EmbeddingsBedrockModelId'}, 'EmbeddingsDimensions'] },
                                                    'INVALID EMBEDDINGS API - Cannot determine dimensions',
                                                ],
                                            },
                                        ],
                                    },
                                    '1', // minimal default to use if embeddings are disabled
                                ],
                            },
                        },
                    ],
                },
            },
        },
    },
    OpensearchDashboards: {
        Type: 'Custom::ESProxy',
        DependsOn: ['Index'],
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['ESCFNProxyLambda', 'Arn'] },
            create: {
                endpoint: { 'Fn::GetAtt': ['ESVar', 'ESAddress'] },
                path: '/_dashboards/api/opensearch-dashboards/dashboards/import?force=true',
                method: 'POST',
                headers: { 'osd-xsrf': 'true' },
                body: require('./opensearch-dashboards/QnABotDashboard'),
                replaceTokenInBody: [
                    { f: '<INDEX_QNA>', r: { 'Fn::Sub': '${Var.QnaIndex}' } },
                    { f: '<INDEX_METRICS>', r: { 'Fn::Sub': '${Var.MetricsIndex}' } },
                    { f: '<INDEX_FEEDBACK>', r: { 'Fn::Sub': '${Var.FeedbackIndex}' } },
                ],
            },
        },
    },
};
