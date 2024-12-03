/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const fs = require('fs');
const path = require('path');

const util = require('../../util');

module.exports = {
    Resources: {
        devBootStrapBucketAccessLogs: {
            Type: 'AWS::S3::Bucket',
            Properties: {
                VersioningConfiguration: {
                    Status: 'Enabled',
                },
                BucketEncryption: {
                    ServerSideEncryptionConfiguration: [
                        {
                            ServerSideEncryptionByDefault: {
                                SSEAlgorithm: 'AES256',
                            },
                        },
                    ],
                },
                PublicAccessBlockConfiguration: {
                    BlockPublicAcls: true,
                    BlockPublicPolicy: true,
                    IgnorePublicAcls: true,
                    RestrictPublicBuckets: true,
                },
            },
            UpdateReplacePolicy: 'Retain',
            // retain only policy is for security auditing purposes
            DeletionPolicy: 'Retain',
            Metadata: {
                cfn_nag: util.cfnNag(['W35']),
                guard: util.cfnGuard('S3_BUCKET_NO_PUBLIC_RW_ACL'),
            },
        },
        devBootStrapBucketAccessLogsPolicy: {
            Type: 'AWS::S3::BucketPolicy',
            DependsOn : 'devBootStrapBucketAccessLogs',
            Properties: {
                Bucket: {
                    Ref: 'devBootStrapBucketAccessLogs',
                },
                PolicyDocument: {
                    Statement: [
                        {
                            Action: 's3:PutObject',
                            Condition: {
                                ArnLike: {
                                    "aws:SourceArn" : "arn:aws:s3:::*"
                                },
                                Bool: {
                                    'aws:SecureTransport': 'true',
                                },
                                StringEquals: {
                                    "aws:SourceAccount": {Ref: 'AWS::AccountId'}
                                }
                            },
                            Effect: 'Allow',
                            Principal: {
                                Service: "logging.s3.amazonaws.com"
                            },
                            Resource: [
                                {
                                    'Fn::Join': [
                                        '',
                                        [
                                            {
                                                'Fn::GetAtt': [
                                                    'devBootStrapBucketAccessLogs',
                                                    'Arn',
                                                ],
                                            },
                                            '/*',
                                        ],
                                    ],
                                },
                                {
                                    'Fn::Join': [
                                        '',
                                        [
                                            {
                                                'Fn::GetAtt': [
                                                    'devBootStrapBucketAccessLogs',
                                                    'Arn',
                                                ],
                                            },
                                        ],
                                    ],
                                },
                            ],                   
                            Sid:'S3ServerAccessLogsPolicy',
                        },
                        {
                            Action: '*',
                            Condition: {
                                Bool: {
                                    'aws:SecureTransport': 'false',
                                },
                            },
                            Effect: 'Deny',
                            Principal: '*',
                            Resource: [
                                {
                                    'Fn::Join': [
                                        '',
                                        [
                                            {
                                                'Fn::GetAtt': [
                                                    'devBootStrapBucketAccessLogs',
                                                    'Arn',
                                                ],
                                            },
                                            '/*',
                                        ],
                                    ],
                                },
                                {
                                    'Fn::Join': [
                                        '',
                                        [
                                            {
                                                'Fn::GetAtt': [
                                                    'devBootStrapBucketAccessLogs',
                                                    'Arn',
                                                ],
                                            },
                                        ],
                                    ],
                                },
                            ],
                            Sid: 'HttpsOnly',
                        }
                    ],
                    Version: '2012-10-17',
                },
            },
        },
        Bucket: {
            Type: 'AWS::S3::Bucket',
            Metadata: { guard: util.cfnGuard('S3_BUCKET_NO_PUBLIC_RW_ACL') },
            DependsOn : ['devBootStrapBucketAccessLogs', 'devBootStrapBucketAccessLogsPolicy'],
            Properties: {
                VersioningConfiguration: {
                    Status: 'Enabled',
                },
                LifecycleConfiguration: {
                    Rules: [{
                        Status: 'Enabled',
                        NoncurrentVersionExpirationInDays: 1,
                    }],
                },
                BucketEncryption: {
                    ServerSideEncryptionConfiguration: [
                        {
                            ServerSideEncryptionByDefault: {
                                SSEAlgorithm: 'AES256',
                            },
                        },
                    ],
                },
                LoggingConfiguration: {
                    DestinationBucketName: { Ref: 'devBootStrapBucketAccessLogs' },
                    LogFilePrefix: {"Fn::Join": ["", [{Ref: 'devBootStrapBucketAccessLogs'},"/"]]},
                }, 
                PublicAccessBlockConfiguration: {
                    BlockPublicAcls: true,
                    BlockPublicPolicy: true,
                    IgnorePublicAcls: true,
                    RestrictPublicBuckets: true,
                },
            },
        },
        HTTPSOnlyBucketPolicy: util.httpsOnlyBucketPolicy(),
        Clean: {
            Type: 'Custom::S3Clean',
            DependsOn: ['CFNLambdaPolicy', 'HTTPSOnlyBucketPolicy'],
            Properties: {
                ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
                Bucket: { Ref: 'Bucket' },
            },
        },
        CFNLambda: {
            Type: 'AWS::Lambda::Function',
            Properties: {
                Code: {
                    ZipFile: fs.readFileSync(`${__dirname}/handler.js`, 'utf-8'),
                },
                Environment: {
                    Variables: {
                        ...util.getCommonEnvironmentVariables()
                    }
                },
                Handler: 'index.handler',
                MemorySize: '128',
                Role: { 'Fn::GetAtt': ['CFNLambdaRole', 'Arn'] },
                Runtime: process.env.npm_package_config_lambdaRuntime,
                Timeout: 60,
            },
            Metadata: {
                cfn_nag: util.cfnNag(['W92']),
                guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
            },
        },
        CFNLambdaRole: {
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
                Policies: [util.basicLambdaExecutionPolicy()],
                Path: '/',
                ManagedPolicyArns: [
                    { Ref: 'CFNLambdaPolicy' },
                ],
            },
            Metadata: {
                cfn_nag: util.cfnNag(['W11', 'F3']),
                guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK'),
            },
        },
        CFNLambdaPolicy: {
            Type: 'AWS::IAM::ManagedPolicy',
            Properties: {
                PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Sid: 'CFNLambdaS3Access',
                            Effect: 'Allow',
                            Action: [
                                's3:ListBucketVersions',
                                's3:PutBucketNotification',
                                's3:PutObject',
                                's3:GetObject',
                                's3:GetObjectVersion',
                                's3:DeleteObject',
                                's3:DeleteObjectVersion',
                            ],
                            Resource: [
                                { 'Fn::Sub': 'arn:aws:s3:::${Bucket}*' },
                            ],
                        },
                    ],
                },
            },
        },
        ReadPolicy: {
            Type: 'AWS::S3::BucketPolicy',
            Condition: 'Public',
            Properties: {
                Bucket: { Ref: 'Bucket' },
                PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [{
                        Sid: 'PublicReadForGetBucketObjects',
                        Effect: 'Allow',
                        Principal: { AWS: '*' },
                        Action: ['s3:Get*', 's3:List*'],
                        Resource: [
                            { 'Fn::Sub': 'arn:aws:s3:::${Bucket}*' },
                        ],
                    }],
                },
            },
        },
    },
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Bootstrap bucket for QnABot assets',
    Mappings: {},
    Outputs: {
        Bucket: {
            Value: {
                Ref: 'Bucket',
            },
        },
        Prefix: {
            Value: 'artifacts/aws-ai-qna-bot',
        },
    },
    Parameters: {
        Public: {
            Type: 'String',
            Default: 'PRIVATE',
        },
    },
    Conditions: {
        Public: { 'Fn::Equals': [{ Ref: 'Public' }, 'PUBLIC'] },
    },
};
