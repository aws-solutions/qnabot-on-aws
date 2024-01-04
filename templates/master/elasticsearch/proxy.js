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

const _ = require('lodash');
const util = require('../../util');

module.exports = {
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
                    DEFAULT_SETTINGS_PARAM: { Ref: 'DefaultQnABotSettings' },
                    CUSTOM_SETTINGS_PARAM: { Ref: 'CustomQnABotSettings' },
                    ...util.getCommonEnvironmentVariables(),
                },
            },
            Layers: [{ Ref: 'CommonModulesLambdaLayer' },
                { Ref: 'CfnLambdaLayer' },
                { Ref: 'EsProxyLambdaLayer' },
                { Ref: 'QnABotCommonLambdaLayer' }],
            Handler: 'resource.handler',
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
        Metadata: util.cfnNag(['W92']),
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
                                            'EmbeddingsSagemaker',
                                            '1024',
                                            {

                                                'Fn::If': [
                                                    'EmbeddingsLambda',
                                                    { Ref: 'EmbeddingsLambdaDimensions' },
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
    KibanaDashboards: {
        Type: 'Custom::ESProxy',
        DependsOn: ['Index'],
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['ESCFNProxyLambda', 'Arn'] },
            create: {
                endpoint: { 'Fn::GetAtt': ['ESVar', 'ESAddress'] },
                path: '/_dashboards/api/opensearch-dashboards/dashboards/import?force=true',
                method: 'POST',
                headers: { 'osd-xsrf': 'true' },
                body: require('./kibana/QnABotDashboard'),
                replaceTokenInBody: [
                    { f: '<INDEX_QNA>', r: { 'Fn::Sub': '${Var.QnaIndex}' } },
                    { f: '<INDEX_METRICS>', r: { 'Fn::Sub': '${Var.MetricsIndex}' } },
                    { f: '<INDEX_FEEDBACK>', r: { 'Fn::Sub': '${Var.FeedbackIndex}' } },
                ],
            },
        },
    },
};
