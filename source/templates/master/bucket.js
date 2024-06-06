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

const util = require('../util');

module.exports = {
    MainAccessLogBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
            VersioningConfiguration: {
                Status: 'Enabled',
            },
            BucketEncryption: {
                ServerSideEncryptionConfiguration: [{
                    ServerSideEncryptionByDefault: {
                        SSEAlgorithm: 'AES256',
                    },
                }],
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
    MainAccessLogsBucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        DependsOn: 'MainAccessLogBucket',
        Properties: {
            Bucket: {
                Ref: 'MainAccessLogBucket',
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
                                                'MainAccessLogBucket',
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
                                                'MainAccessLogBucket',
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
                                                'MainAccessLogBucket',
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
                                                'MainAccessLogBucket',
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
    ExportBucket: {
        Type: 'AWS::S3::Bucket',
        Metadata: { guard: util.cfnGuard('S3_BUCKET_NO_PUBLIC_RW_ACL') },
        DependsOn : ['MainAccessLogBucket', 'MainAccessLogsBucketPolicy'],
        Properties: {
            LifecycleConfiguration: {
                Rules: [{
                    NoncurrentVersionExpirationInDays: 1,
                    Status: 'Enabled',
                }, {
                    AbortIncompleteMultipartUpload: {
                        DaysAfterInitiation: 1,
                    },
                    Status: 'Enabled',
                }],
            },
            VersioningConfiguration: {
                Status: 'Enabled',
            },
            CorsConfiguration: {
                CorsRules: [{
                    AllowedHeaders: ['*'],
                    AllowedMethods: ['GET'],
                    AllowedOrigins: ['*'],
                }],
            },
            BucketEncryption: {
                ServerSideEncryptionConfiguration: [{
                    ServerSideEncryptionByDefault: {
                        SSEAlgorithm: 'AES256',
                    },
                }],
            },
            LoggingConfiguration: {
                DestinationBucketName: { Ref: 'MainAccessLogBucket' },
                LogFilePrefix: {"Fn::Join": ["", [{Ref: 'MainAccessLogBucket'},"/Export/"]]},
             }, 
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true,
            },
        },
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
    },
    HTTPSOnlyExportBucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
            Bucket: {
                Ref: 'ExportBucket',
            },
            PolicyDocument: {
                Statement: [
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
                                                'ExportBucket',
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
                                                'ExportBucket',
                                                'Arn',
                                            ],
                                        },
                                    ],
                                ],
                            },
                        ],
                        Sid: 'HttpsOnly',
                    },
                ],
                Version: '2012-10-17',
            },
        },
    },
    ImportBucket: {
        Type: 'AWS::S3::Bucket',
        Metadata: { guard: util.cfnGuard('S3_BUCKET_NO_PUBLIC_RW_ACL') },
        DependsOn : ['MainAccessLogBucket', 'MainAccessLogsBucketPolicy'],
        Properties: {
            LifecycleConfiguration: {
                Rules: [{
                    ExpirationInDays: 1,
                    Status: 'Enabled',
                }],
            },
            VersioningConfiguration: {
                Status: 'Enabled',
            },
            CorsConfiguration: {
                CorsRules: [{
                    AllowedHeaders: ['*'],
                    AllowedMethods: ['PUT'],
                    AllowedOrigins: ['*'],
                }],
            },
            BucketEncryption: {
                ServerSideEncryptionConfiguration: [{
                    ServerSideEncryptionByDefault: {
                        SSEAlgorithm: 'AES256',
                    },
                }],
            },
            LoggingConfiguration: {
                DestinationBucketName: { Ref: 'MainAccessLogBucket' },
                LogFilePrefix: {"Fn::Join": ["", [{Ref: 'MainAccessLogBucket'},"/Import/"]]},
             }, 
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true,
            },
        },
    },
    HTTPSOnlyImportBucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
            Bucket: {
                Ref: 'ImportBucket',
            },
            PolicyDocument: {
                Statement: [
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
                                                'ImportBucket',
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
                                                'ImportBucket',
                                                'Arn',
                                            ],
                                        },
                                    ],
                                ],
                            },
                        ],
                        Sid: 'HttpsOnly',
                    },
                ],
                Version: '2012-10-17',
            },
        },
    },
    TestAllBucket: {
        Type: 'AWS::S3::Bucket',
        Metadata: { guard: util.cfnGuard('S3_BUCKET_NO_PUBLIC_RW_ACL') },
        DependsOn : ['MainAccessLogBucket', 'MainAccessLogsBucketPolicy'],
        Properties: {
            LifecycleConfiguration: {
                Rules: [{
                    ExpirationInDays: 1,
                    Status: 'Enabled',
                }],
            },
            VersioningConfiguration: {
                Status: 'Enabled',
            },
            CorsConfiguration: {
                CorsRules: [{
                    AllowedHeaders: ['*'],
                    AllowedMethods: ['GET'],
                    AllowedOrigins: ['*'],
                }],
            },
            BucketEncryption: {
                ServerSideEncryptionConfiguration: [{
                    ServerSideEncryptionByDefault: {
                        SSEAlgorithm: 'AES256',
                    },
                }],
            },
            LoggingConfiguration: {
                DestinationBucketName: { Ref: 'MainAccessLogBucket' },
                LogFilePrefix: {"Fn::Join": ["", [{Ref: 'MainAccessLogBucket'},"/TestAll/"]]},
             }, 
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true,
            },
        },
    },
    HTTPSOnlyTestAllBucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
            Bucket: {
                Ref: 'TestAllBucket',
            },
            PolicyDocument: {
                Statement: [
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
                                                'TestAllBucket',
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
                                                'TestAllBucket',
                                                'Arn',
                                            ],
                                        },
                                    ],
                                ],
                            },
                        ],
                        Sid: 'HttpsOnly',
                    },
                ],
                Version: '2012-10-17',
            },
        },
    },
};
