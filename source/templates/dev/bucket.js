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

const outputs = require('../../bin/exports');
const util = require('../util');

module.exports = outputs('dev/bootstrap')
    .then((output) => ({
        Description: 'This template creates dev OpenSearch Cluster',
        Resources: {
            devBucketAccessLogs: {
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
            devBucketAccessLogsPolicy: {
                Type: 'AWS::S3::BucketPolicy',
                DependsOn : 'devBucketAccessLogs',
                Properties: {
                    Bucket: {
                        Ref: 'devBucketAccessLogs',
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
                                                        'devBucketAccessLogs',
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
                                                        'devBucketAccessLogs',
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
                                                        'devBucketAccessLogs',
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
                                                        'devBucketAccessLogs',
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
                DependsOn : ['devBucketAccessLogs', 'devBucketAccessLogsPolicy'],
                DeletionPolicy: 'Delete',
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
                    LoggingConfiguration: {
                        DestinationBucketName: { Ref: 'devBucketAccessLogs' },
                        LogFilePrefix: {"Fn::Join": ["", [{Ref: 'devBucketAccessLogs'},"/"]]},
                    }, 
                    PublicAccessBlockConfiguration: {
                        BlockPublicAcls: true,
                        BlockPublicPolicy: true,
                        IgnorePublicAcls: true,
                        RestrictPublicBuckets: true,
                    },
                },
            },
            S3Clean: {
                Type: 'AWS::Lambda::Function',
                Metadata: { guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC') },
                Properties: {
                    Code: {
                        S3Bucket: output.Bucket,
                        S3Key: {
                            'Fn::Join': ['', [
                                output.Prefix,
                                '/lambda/s3-clean.zip',
                            ]],
                        },
                    },
                    Environment: {
                        Variables: {
                            ...util.getCommonEnvironmentVariables()
                        },
                    },
                    Description: 'This function clears all S3 objects from the bucket of a given S3-based resource',
                    Handler: 'lambda_function.handler',
                    Role: {
                        'Fn::GetAtt': ['CFNLambdaRole', 'Arn'],
                    },
                    Runtime: process.env.npm_package_config_pythonRuntime,
                    Tags: [{
                        Key: 'Type',
                        Value: 'S3 Clean',
                    }],
                    Timeout: 300,
                },
            },
            Clean: {
                Type: 'Custom::S3Clean',
                DependsOn: ['CFNLambdaPolicy'],
                Properties: {
                    ServiceToken: { 'Fn::GetAtt': ['S3Clean', 'Arn'] },
                    Bucket: { Ref: 'Bucket' },
                },
            },
            CFNLambda: {
                Type: 'AWS::Lambda::Function',
                Properties: {
                    Code: {
                        S3Bucket: output.Bucket,
                        S3Key: {
                            'Fn::Join': ['', [
                                output.Prefix,
                                '/lambda/cfn.zip',
                            ]],
                        },
                    },
                    Environment: {
                        Variables: {
                            ...util.getCommonEnvironmentVariables()
                        },
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
                                    's3:DeleteObjectVersion',
                                    's3:DeleteObject',
                                    's3:GetObjectVersion',
                                ],
                                Resource: [
                                    { 'Fn::Sub': 'arn:aws:s3:::${Bucket}*' },
                                ],
                            },
                        ],
                    },
                },
            },
        },
        Outputs: {
            Bucket: {
                Value: { Ref: 'Bucket' },
            },
        },
    }));
