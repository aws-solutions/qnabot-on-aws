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

const util = require('../../util');

module.exports = {
    FeedbackKinesisFirehoseLogGroup: {
        Type: 'AWS::Logs::LogGroup',
        Properties: {
            LogGroupName: { 'Fn::Sub': '/aws/kinesisfirehose/${AWS::StackName}-FeedbackKinesisFirehose' }
        },
        Metadata: {
            cfn_nag: {
                rules_to_suppress: [
                    {
                        id: 'W86',
                        reason: 'LogGroup is encrypted by default.',
                    },
                    {
                        id: 'W84',
                        reason: 'LogGroup needs to be retained indefinitely',
                    },
                ],
            },
        },
    },
    FeedbackKinesisFirehoseStreamOpenSearch: {
        Type: 'AWS::Logs::LogStream',
        DependsOn: ['FeedbackKinesisFirehoseLogGroup'],
        Properties: {
            LogGroupName: { Ref: 'FeedbackKinesisFirehoseLogGroup' },
            LogStreamName: 'OpenSearchDestinationDelivery'
        }
    },
    FeedbackKinesisFirehoseStreamS3: {
        Type: 'AWS::Logs::LogStream',
        DependsOn: ['FeedbackKinesisFirehoseLogGroup'],
        Properties: {
            LogGroupName: { Ref: 'FeedbackKinesisFirehoseLogGroup' },
            LogStreamName: 'S3BackupDelivery'
        }
    },
    FeedbackKinesisFirehose: {
        Type: 'AWS::KinesisFirehose::DeliveryStream',
        Metadata: {
            guard: util.cfnGuard(
                'KINESIS_FIREHOSE_SPLUNK_DESTINATION_CONFIGURATION_NO_PLAINTEXT_PASSWORD',
                'KINESIS_FIREHOSE_REDSHIFT_DESTINATION_CONFIGURATION_NO_PLAINTEXT_PASSWORD',
            ),
        },
        DependsOn: [ 'FeedbackKinesisFirehoseStreamS3', 'FeedbackKinesisFirehoseStreamOpenSearch', 'FirehoseESS3Role'],
        Properties: {
            DeliveryStreamType: 'DirectPut',
            DeliveryStreamEncryptionConfigurationInput: {
                KeyType: 'AWS_OWNED_CMK'
            },
            AmazonopensearchserviceDestinationConfiguration: {
                BufferingHints: {
                    IntervalInSeconds: 60,
                    SizeInMBs: 5
                },
                CloudWatchLoggingOptions: {
                    Enabled: true,
                    LogGroupName: { Ref: 'FeedbackKinesisFirehoseLogGroup' },
                    LogStreamName: { Ref: 'FeedbackKinesisFirehoseStreamOpenSearch' }
                },
                DomainARN: { 'Fn::GetAtt': ['ESVar', 'ESArn'] },
                IndexName: { 'Fn::Sub': '${Var.FeedbackIndex}' },
                IndexRotationPeriod: 'NoRotation',
                RetryOptions: {
                    DurationInSeconds: 300
                },
                RoleARN: { 'Fn::GetAtt': ['FirehoseESS3Role', 'Arn'] },
                S3BackupMode: 'AllDocuments',
                S3Configuration: {
                    BucketARN: { 'Fn::GetAtt': ['MetricsBucket', 'Arn'] },
                    CloudWatchLoggingOptions: {
                        Enabled: true,
                        LogGroupName: { Ref: 'FeedbackKinesisFirehoseLogGroup' },
                        LogStreamName: { Ref: 'FeedbackKinesisFirehoseStreamS3' }
                    },
                    BufferingHints: {
                        IntervalInSeconds: 60,
                        SizeInMBs: 5
                    },
                    Prefix: 'feedback/',
                    CompressionFormat: 'UNCOMPRESSED',
                    RoleARN: { 'Fn::GetAtt': ['FirehoseESS3Role', 'Arn'] }
                },
                TypeName: '',
                VpcConfiguration: {
                    'Fn::If': [
                        'VPCEnabled',
                        {
                            RoleARN: { 'Fn::GetAtt': ['FirehoseESS3Role', 'Arn'] },
                            SubnetIds: { Ref: 'VPCSubnetIdList' },
                            SecurityGroupIds: { Ref: 'VPCSecurityGroupIdList' }
                        },
                        { Ref: 'AWS::NoValue' }
                    ]
                }
            },
        }
    },
    GeneralKinesisFirehoseLogGroup: {
        Type: 'AWS::Logs::LogGroup',
        Properties: {
            LogGroupName: { 'Fn::Sub': '/aws/kinesisfirehose/${AWS::StackName}-GeneralKinesisFirehose' }
        },
        Metadata: {
            cfn_nag: {
                rules_to_suppress: [
                    {
                        id: 'W86',
                        reason: 'LogGroup is encrypted by default.',
                    },
                    {
                        id: 'W84',
                        reason: 'LogGroup needs to be retained indefinitely',
                    },
                ],
            },
        },
    },
    GeneralKinesisFirehoseStreamOpenSearch: {
        Type: 'AWS::Logs::LogStream',
        Properties: {
            LogGroupName: { Ref: 'GeneralKinesisFirehoseLogGroup' },
            LogStreamName: 'OpenSearchDestinationDelivery'
        }
    },
    GeneralKinesisFirehoseStreamS3: {
        Type: 'AWS::Logs::LogStream',
        Properties: {
            LogGroupName: { Ref: 'GeneralKinesisFirehoseLogGroup' },
            LogStreamName: 'S3BackupDelivery'
        }
    },
    GeneralKinesisFirehose: {
        Type: 'AWS::KinesisFirehose::DeliveryStream',
        Metadata: {
            guard: util.cfnGuard(
                'KINESIS_FIREHOSE_REDSHIFT_DESTINATION_CONFIGURATION_NO_PLAINTEXT_PASSWORD',
                'KINESIS_FIREHOSE_SPLUNK_DESTINATION_CONFIGURATION_NO_PLAINTEXT_PASSWORD',
            ),
        },
        DependsOn: ['GeneralKinesisFirehoseStreamOpenSearch', 'GeneralKinesisFirehoseStreamS3', 'FirehoseESS3Role'],
        Properties: {
            DeliveryStreamType: 'DirectPut',
            DeliveryStreamEncryptionConfigurationInput: {
                KeyType: 'AWS_OWNED_CMK'
            },
            AmazonopensearchserviceDestinationConfiguration: {
                BufferingHints: {
                    IntervalInSeconds: 60,
                    SizeInMBs: 5
                },
                CloudWatchLoggingOptions: {
                    Enabled: true,
                    LogGroupName: { Ref: 'GeneralKinesisFirehoseLogGroup' },
                    LogStreamName: { Ref: 'GeneralKinesisFirehoseStreamOpenSearch' }
                },
                DomainARN: { 'Fn::GetAtt': ['ESVar', 'ESArn'] },
                IndexName: { 'Fn::Sub': '${Var.MetricsIndex}' },
                IndexRotationPeriod: 'NoRotation',
                RetryOptions: {
                    DurationInSeconds: 300
                },
                RoleARN: { 'Fn::GetAtt': ['FirehoseESS3Role', 'Arn'] },
                S3BackupMode: 'AllDocuments',
                S3Configuration: {
                    BucketARN: { 'Fn::GetAtt': ['MetricsBucket', 'Arn'] },
                    CloudWatchLoggingOptions: {
                        Enabled: true,
                        LogGroupName: { Ref: 'GeneralKinesisFirehoseLogGroup' },
                        LogStreamName: { Ref: 'GeneralKinesisFirehoseStreamS3' }
                    },
                    Prefix: 'metrics/',
                    BufferingHints: {
                        IntervalInSeconds: 60,
                        SizeInMBs: 5
                    },
                    CompressionFormat: 'UNCOMPRESSED',
                    RoleARN: { 'Fn::GetAtt': ['FirehoseESS3Role', 'Arn'] }
                },
                TypeName: '',
                VpcConfiguration: {
                    'Fn::If': [
                        'VPCEnabled',
                        {
                            RoleARN: { 'Fn::GetAtt': ['FirehoseESS3Role', 'Arn'] },
                            SubnetIds: { Ref: 'VPCSubnetIdList' },
                            SecurityGroupIds: { Ref: 'VPCSecurityGroupIdList' }
                        },
                        { Ref: 'AWS::NoValue' }
                    ]
                }
            },
        }
    },
    MetricsBucket: {
        Type: 'AWS::S3::Bucket',
        Metadata: { guard: util.cfnGuard('S3_BUCKET_NO_PUBLIC_RW_ACL') },
        DependsOn: ['MainAccessLogBucket', 'MainAccessLogsBucketPolicy'],
        DeletionPolicy: 'Delete',
        Properties: {
            VersioningConfiguration: {
                Status: 'Enabled'
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
                LogFilePrefix: { 'Fn::Join': ['', [{ Ref: 'MainAccessLogBucket' }, '/Metrics/']] }
            },
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true
            },
            Tags: [
                {
                    Key: 'Use',
                    Value: 'Metrics'
                }
            ]
        }
    },
    HTTPSOnlyMetricBucketsPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
            Bucket: {
                Ref: 'MetricsBucket'
            },
            PolicyDocument: {
                Statement: [
                    {
                        Action: '*',
                        Condition: {
                            Bool: {
                                'aws:SecureTransport': 'false'
                            }
                        },
                        Effect: 'Deny',
                        Principal: '*',
                        Resource: [
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Fn::GetAtt': ['MetricsBucket', 'Arn']
                                        },
                                        '/*'
                                    ]
                                ]
                            },
                            {
                                'Fn::Join': [
                                    '',
                                    [
                                        {
                                            'Fn::GetAtt': ['MetricsBucket', 'Arn']
                                        }
                                    ]
                                ]
                            }
                        ],
                        Sid: 'HttpsOnly'
                    }
                ],
                Version: '2012-10-17'
            }
        }
    },
    MetricsBucketClean: {
        Type: 'Custom::S3Clean',
        DependsOn: ['CFNInvokePolicy', 'HTTPSOnlyMetricBucketsPolicy'],
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['S3Clean', 'Arn'] },
            Bucket: { Ref: 'MetricsBucket' }
        }
    },
    FirehoseESS3Role: {
        Type: 'AWS::IAM::Role',
        Properties: {
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'firehose.amazonaws.com'
                        },
                        Action: 'sts:AssumeRole'
                    }
                ]
            },
            Path: '/',
            Policies: [
                {
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Sid: 'FirehoseS3DeliveryPermissions',
                                Effect: 'Allow',
                                Action: [
                                    's3:AbortMultipartUpload',
                                    's3:GetBucketLocation',
                                    's3:GetObject',
                                    's3:ListBucket',
                                    's3:ListBucketMultipartUploads',
                                    's3:PutObject'
                                ],
                                Resource: [
                                    { 'Fn::GetAtt': ['MetricsBucket', 'Arn'] },
                                    { 'Fn::Join': ['', [{ 'Fn::GetAtt': ['MetricsBucket', 'Arn'] }, '/*']] }
                                ]
                            },
                            {
                                Sid: 'FirehoseLambdaPermissions',
                                Effect: 'Allow',
                                Action: ['lambda:InvokeFunction', 'lambda:GetFunctionConfiguration'],
                                Resource: [
                                    {
                                        'Fn::Join': [
                                            '',
                                            [
                                                'arn:aws:lambda:',
                                                { Ref: 'AWS::Region' },
                                                ':',
                                                { Ref: 'AWS::AccountId' },
                                                ':function:%FIREHOSE_DEFAULT_FUNCTION%:%FIREHOSE_DEFAULT_VERSION%'
                                            ]
                                        ]
                                    }
                                ]
                            },
                            {
                                Sid: 'FirehoseOpenSearchDestinationPermissions',
                                Effect: 'Allow',
                                Action: [
                                    'es:DescribeDomain',
                                    'es:DescribeDomains',
                                    'es:DescribeDomainConfig',
                                    'es:ESHttpPost',
                                    'es:ESHttpPut',
                                    'es:ESHttpGet'
                                ],
                                Resource: [
                                    { 'Fn::GetAtt': ['ESVar', 'ESArn'] },
                                    { 'Fn::Join': ['', [{ 'Fn::GetAtt': ['ESVar', 'ESArn'] }, '/*']] }
                                ]
                            },
                            {
                                Sid: 'FirehoseLogsPermissions',
                                Effect: 'Allow',
                                Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                                Resource: [
                                    {
                                        'Fn::Join': [
                                            '',
                                            [
                                                'arn:aws:logs:',
                                                { Ref: 'AWS::Region' },
                                                ':',
                                                { Ref: 'AWS::AccountId' },
                                                ':log-group:/aws/kinesisfirehose/*'
                                            ]
                                        ]
                                    }
                                ]
                            },
                            {
                                Sid: 'FireHoseVPCConfiguration', // https://docs.aws.amazon.com/firehose/latest/APIReference/API_VpcConfigurationDescription.html
                                Effect: 'Allow',
                                Action: [
                                    'ec2:DescribeVpcs',
                                    'ec2:DescribeVpcAttribute',
                                    'ec2:DescribeSubnets',
                                    'ec2:DescribeSecurityGroups',
                                    'ec2:DescribeNetworkInterfaces',
                                    'ec2:CreateNetworkInterface',
                                    'ec2:CreateNetworkInterfacePermission',
                                    'ec2:DeleteNetworkInterface'
                                ],
                                Resource: '*' // these actions cannot be bound to resources other than *
                            }
                        ]
                    },
                    PolicyName: 'QnAFirehose'
                }
            ]
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W11']),
            guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK'),
        },
    }
};
