/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const fs = require('fs');

const util = require('../../util');

module.exports = {
    VersionLambdaLogGroup: {
        Type: 'AWS::Logs::LogGroup',
        Properties: {
            LogGroupName: {
                'Fn::Join': [
                    '-',
                    [
                        { 'Fn::Sub': '/aws/lambda/${AWS::StackName}-VersionLambda' },
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
    VersionLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                // join files by new line to ensure valid javascript
                ZipFile: fs.readFileSync(`${__dirname}/handler.js`, 'utf-8'),
            },
            Environment: {
                Variables: {
                    ...util.getCommonEnvironmentVariables(),
                },
            },
            Handler: 'index.handler',
            LoggingConfig: {
                LogGroup: { Ref: 'VersionLambdaLogGroup' },
            },
            MemorySize: '3008',
            Role: { 'Fn::GetAtt': ['CFNLambdaRole', 'Arn'] },
            Runtime: process.env.npm_package_config_lambdaRuntime,
            Timeout: 60,
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
    CFNVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['VersionLambda', 'Arn'] },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/cfn.zip' },
            BuildDate: (new Date()).toISOString(),
        },
    },
    CFNLambdaLogGroup: {
        Type: 'AWS::Logs::LogGroup',
        Properties: {
            LogGroupName: { 
                'Fn::Join': [
                    '-',
                    [
                        { 'Fn::Sub': '/aws/lambda/${AWS::StackName}-CFNLambda' },
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
    CFNLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: {
                    'Fn::Join': ['', [
                        { Ref: 'BootstrapPrefix' },
                        '/lambda/cfn.zip',
                    ]],
                },
                S3ObjectVersion: { 'Fn::GetAtt': ['CFNVersion', 'version'] },
            },
            Environment: {
                Variables: {
                    ...util.getCommonEnvironmentVariables(),
                }
            },
            Handler: 'index.handler',
            LoggingConfig: {
                LogGroup: { Ref: 'CFNLambdaLogGroup' },
            },
            MemorySize: '3008',
            Role: { 'Fn::GetAtt': ['CFNLambdaRole', 'Arn'] },
            Runtime: process.env.npm_package_config_lambdaRuntime,
            Timeout: 180,
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
    CFNInvokePolicy: {
        Type: 'AWS::IAM::ManagedPolicy',
        Properties: {
            PolicyDocument: {
                Version: '2012-10-17',
                Statement: [{
                    Effect: 'Allow',
                    Action: [
                        'lambda:InvokeFunction',
                    ],
                    Resource: [
                        { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
                    ],
                }],
            },
            Roles: [{ Ref: 'CFNLambdaRole' }],
        },
    },
};
