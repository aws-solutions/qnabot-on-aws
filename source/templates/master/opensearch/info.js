/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const fs = require('fs');

const util = require('../../util');

module.exports = {
    ESInfo: {
        Type: 'Custom::ESProxy',
        Condition: 'DontCreateDomain',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['ESProxyLambda', 'Arn'] },
            name: { Ref: 'OpenSearchName' },
        },
    },
    ESInfoLambdaLogGroup:{
        Type: 'AWS::Logs::LogGroup',
        Condition: 'DontCreateDomain',
        Properties: {
            LogGroupName: {
                'Fn::Join': [
                    '-',
                    [
                        { 'Fn::Sub': '/aws/lambda/${AWS::StackName}-ESInfoLambda' },
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
    ESInfoLambda: {
        Type: 'AWS::Lambda::Function',
        Condition: 'DontCreateDomain',
        Properties: {
            Code: {
                ZipFile: fs.readFileSync(`${__dirname}/handler.js`, 'utf-8'),
            },
            Handler: 'index.handler',
            LoggingConfig: {
                LogGroup: { Ref: 'ESInfoLambdaLogGroup' },
            },
            MemorySize: '128',
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
            Layers: [
                { Ref: 'AwsSdkLayerLambdaLayer' },
            ],
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
};
