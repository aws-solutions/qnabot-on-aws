/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const util = require('../../util');

module.exports = {
    LexV2BotLambdaLogGroup:{
        Type: 'AWS::Logs::LogGroup',
        Properties: {
            LogGroupName: {
                'Fn::Join': [
                    '-',
                    [
                        { 'Fn::Sub': '/aws/lambda/${AWS::StackName}-LexV2BotLambda' },
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
    Lexv2BotLambda: lambda({
        S3Bucket: { Ref: 'BootstrapBucket' },
        S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/lexv2-build.zip' },
        S3ObjectVersion: { Ref: 'Lexv2BotCodeVersion' },
    }, {
        STACKNAME: { Ref: 'AWS::StackName' },
        FULFILLMENT_LAMBDA_ARN: {
            'Fn::Join': [':', [
                { 'Fn::GetAtt': ['FulfillmentLambda', 'Arn'] },
                'live',
            ]],
        },
        LOCALES: { Ref: 'LexV2BotLocaleIds' },
        PYTHONPATH: '/var/task/py_modules:/var/runtime:/opt/python',
        ...util.getCommonEnvironmentVariables(),
    }, process.env.npm_package_config_pythonRuntime,
    {
        LogGroup: { Ref: 'LexV2BotLambdaLogGroup' },
    }),
    Lexv2BotCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/lexv2-build.zip' },
            BuildDate: (new Date()).toISOString(),
        },
    },
    Lexv2BotLambdaRole: {
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
            // There in no LexV2 managed policy (yet) so adding inline policy to allow creation of LexV2 ServiceLinkedRole
            Policies: [
                util.basicLambdaExecutionPolicy(),
                util.lambdaVPCAccessExecutionRole(),
                util.xrayDaemonWriteAccess(),
                util.lexFullAccess(),
                {
                    PolicyName: 'LexV2ServiceLinkedRole',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Action: [
                                    'iam:GetRole',
                                    'iam:DeleteRole',
                                ],
                                Resource: [
                                    'arn:aws:iam::*:role/aws-service-role/lexv2.amazonaws.com/AWSServiceRoleForLexV2Bots*',
                                ],
                            },
                            {
                                Effect: 'Allow',
                                Action: [
                                    'iam:CreateServiceLinkedRole',
                                ],
                                Resource: [
                                    'arn:aws:iam::*:role/aws-service-role/lexv2.amazonaws.com/AWSServiceRoleForLexV2Bots*',
                                ],
                                Condition: {
                                    StringLike: {
                                        'iam:AWSServiceName': 'lexv2.amazonaws.com',
                                    },
                                },
                            },
                            {
                                Action: [
                                    'iam:PassRole',
                                ],
                                Effect: 'Allow',
                                Resource: [
                                    'arn:aws:iam::*:role/aws-service-role/lexv2.amazonaws.com/AWSServiceRoleForLexV2Bots*',
                                ],
                                Condition: {
                                    StringLike: {
                                        'iam:PassedToService': [
                                            'lexv2.amazonaws.com',
                                        ],
                                    },
                                },
                            },
                            {
                                Action: [
                                    'translate:TranslateText',
                                    'comprehend:DetectDominantLanguage',
                                ],
                                Effect: 'Allow',
                                Resource: '*', // these actions cannot be bound to resources other than *
                            },
                        ],
                    },
                },
                {
                    PolicyName: 'BuildStatusBucketAccess',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [{
                            Effect: 'Allow',
                            Action: ['s3:Get*', 's3:Put*'],
                            Resource: [
                                { 'Fn::Sub': 'arn:aws:s3:::${BuildStatusBucket}*' },
                            ],
                        }],
                    },
                },
            ],
            Path: '/',
            ManagedPolicyArns: [
                { Ref: 'QueryPolicy' },
            ],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W11', 'W12', 'W76', 'F3']),
            guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK'),
        },
    },
};

function lambda(code, variable, runtime, loggingConfig) {
    return {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: code,
            Environment: {
                Variables: variable,
            },
            Handler: 'handler.handler',
            LoggingConfig: loggingConfig,
            MemorySize: '1024',
            Role: { 'Fn::GetAtt': ['Lexv2BotLambdaRole', 'Arn'] },
            Runtime: runtime,
            Timeout: 900,
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
                Value: 'Api',
            }],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    };
}
