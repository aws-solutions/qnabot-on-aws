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

module.exports = {
    CommonModulesLayerCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/common-modules-layer.zip' },
            BuildDate: new Date().toISOString(),
        },
    },
    CommonModulesLambdaLayer: {
        Type: 'AWS::Lambda::LayerVersion',
        Properties: {
            LayerName: {
                'Fn::Join': [
                    '-',
                    [
                        'CommonModules',
                        {
                            'Fn::Select': [
                                2,
                                { 'Fn::Split': ['-', { Ref: 'DefaultQnABotSettings' }] },
                            ],
                        },
                    ],
                ],
            },
            Content: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: {
                    'Fn::Sub': '${BootstrapPrefix}/lambda/common-modules-layer.zip',
                },
                S3ObjectVersion: { Ref: 'CommonModulesLayerCodeVersion' },
            },
            CompatibleRuntimes: [process.env.npm_package_config_lambdaRuntime],
        },
    },
    QnABotCommonLayerCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/qnabot-common-layer.zip' },
            BuildDate: new Date().toISOString(),
        },
    },
    QnABotCommonLambdaLayer: {
        Type: 'AWS::Lambda::LayerVersion',
        Properties: {
            LayerName: {
                'Fn::Join': [
                    '-',
                    [
                        'QnABotCommon',
                        {
                            'Fn::Select': [
                                2,
                                { 'Fn::Split': ['-', { Ref: 'DefaultQnABotSettings' }] },
                            ],
                        },
                    ],
                ],
            },
            Content: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: {
                    'Fn::Sub': '${BootstrapPrefix}/lambda/qnabot-common-layer.zip',
                },
                S3ObjectVersion: { Ref: 'QnABotCommonLayerCodeVersion' },
            },
            CompatibleRuntimes: [process.env.npm_package_config_lambdaRuntime],
        },
    },
    AwsSdkLayerCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/aws-sdk-layer.zip' },
            BuildDate: new Date().toISOString(),
        },
    },
    AwsSdkLayerLambdaLayer: {
        Type: 'AWS::Lambda::LayerVersion',
        Properties: {
            Content: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/aws-sdk-layer.zip' },
                S3ObjectVersion: { Ref: 'AwsSdkLayerCodeVersion' },
            },
            LayerName: {
                'Fn::Join': [
                    '-',
                    [
                        'AwsSdk',
                        {
                            'Fn::Select': [
                                2,
                                { 'Fn::Split': ['-', { Ref: 'DefaultQnABotSettings' }] },
                            ],
                        },
                    ],
                ],
            },
            CompatibleRuntimes: [process.env.npm_package_config_lambdaRuntime],
        },
    },
    CfnLambdaLayerCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/cfn-lambda-layer.zip' },
            BuildDate: new Date().toISOString(),
        },
    },
    CfnLambdaLayer: {
        Type: 'AWS::Lambda::LayerVersion',
        Properties: {
            LayerName: {
                'Fn::Join': [
                    '-',
                    [
                        'CfnLambdaModule',
                        {
                            'Fn::Select': [
                                2,
                                { 'Fn::Split': ['-', { Ref: 'DefaultQnABotSettings' }] },
                            ],
                        },
                    ],
                ],
            },
            Content: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/cfn-lambda-layer.zip' },
                S3ObjectVersion: { Ref: 'CfnLambdaLayerCodeVersion' },
            },
            CompatibleRuntimes: [process.env.npm_package_config_lambdaRuntime],
        },
    },
    EsProxyLayerCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/es-proxy-layer.zip' },
            BuildDate: new Date().toISOString(),
        },
    },
    EsProxyLambdaLayer: {
        Type: 'AWS::Lambda::LayerVersion',
        Properties: {
            LayerName: {
                'Fn::Join': [
                    '-',
                    [
                        'EsProxy',
                        {
                            'Fn::Select': [
                                2,
                                { 'Fn::Split': ['-', { Ref: 'DefaultQnABotSettings' }] },
                            ],
                        },
                    ],
                ],
            },
            Content: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/es-proxy-layer.zip' },
                S3ObjectVersion: { Ref: 'EsProxyLayerCodeVersion' },
            },
            CompatibleRuntimes: [process.env.npm_package_config_lambdaRuntime],
        },
    },
};
