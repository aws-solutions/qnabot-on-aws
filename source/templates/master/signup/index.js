/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const fs = require('fs');
const util = require('../../util');

module.exports = {
    SignupPermision: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            Action: 'lambda:InvokeFunction',
            FunctionName: { 'Fn::GetAtt': ['SignupLambda', 'Arn'] },
            Principal: 'cognito-idp.amazonaws.com',
            SourceArn: { 'Fn::GetAtt': ['UserPool', 'Arn'] },
        },
    },
    MessagePermision: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            Action: 'lambda:InvokeFunction',
            FunctionName: { 'Fn::GetAtt': ['MessageLambda', 'Arn'] },
            Principal: 'cognito-idp.amazonaws.com',
            SourceArn: { 'Fn::GetAtt': ['UserPool', 'Arn'] },
        },
    },
    MessageLambdaLogGroup: {
        Type: 'AWS::Logs::LogGroup',
        Properties: {
            LogGroupName: {
                'Fn::Join': [
                    '-',
                    [
                        { 'Fn::Sub': '/aws/lambda/${AWS::StackName}-MessageLambda' },
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
    MessageLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                ZipFile: fs.readFileSync(`${__dirname}/message.js`, 'utf8'),
            },
            Handler: 'index.handler',
            LoggingConfig: {
                LogGroup: { Ref: 'MessageLambdaLogGroup' },
            },
            MemorySize: '128',
            Environment: {
                Variables: {
                    APPROVED_DOMAIN: {
                        'Fn::If': [
                            'Domain',
                            { Ref: 'ApprovedDomain' },
                            { Ref: 'AWS::NoValue' },
                        ],
                    },
                },
            },
            Role: {
                'Fn::GetAtt': [
                    'SignupLambdaRole',
                    'Arn',
                ],
            },
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
                Value: 'Cognito',
            }],

        },
        Metadata: {
            cfn_nag: util.cfnNag(['W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    },
    SignupLambdaLogGroup: {
        Type: 'AWS::Logs::LogGroup',
        Properties: {
            LogGroupName: {
                'Fn::Join': [
                    '-',
                    [
                        { 'Fn::Sub': '/aws/lambda/${AWS::StackName}-SignupLambda' },
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
    SignupLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                ZipFile: fs.readFileSync(`${__dirname}/signup.js`, 'utf8'),
            },
            Handler: 'index.handler',
            LoggingConfig: {
                LogGroup: { Ref: 'SignupLambdaLogGroup' },
            },
            MemorySize: '128',
            Environment: {
                Variables: {
                    APPROVED_DOMAIN: {
                        'Fn::If': [
                            'Domain',
                            { Ref: 'ApprovedDomain' },
                            { Ref: 'AWS::NoValue' },
                        ],
                    },
                },
            },
            Role: {
                'Fn::GetAtt': [
                    'SignupLambdaRole',
                    'Arn',
                ],
            },
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
                Value: 'Cognito',
            }],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    },
    SignupLambdaRole: {
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
            ],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W11', 'W12']),
            guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK'),
        },
    },
};
