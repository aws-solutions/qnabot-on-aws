/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const util = require('../util');

module.exports = {
    AssetBucket: {
        Type: 'AWS::S3::Bucket',
        DependsOn : ['MainAccessLogBucket', 'MainAccessLogsBucketPolicy'],
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
            LoggingConfiguration: {
                DestinationBucketName: { Ref: 'MainAccessLogBucket' },
                LogFilePrefix: {"Fn::Join": ["", [{Ref: 'MainAccessLogBucket'},"/Assets/"]]},
             },
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true,
            },
        },
        Metadata: {
            cfn_nag: {
                rules_to_suppress: [{
                    id: 'F14',
                    reason: 'AccessControl is deprecated.',
                }],
            },
            guard: util.cfnGuard('S3_BUCKET_NO_PUBLIC_RW_ACL'),
        },
    },
    HTTPSOnlyAssetBucketPolicy: util.httpsOnlyBucketPolicy('AssetBucket'),
    AssetClean: {
        Type: 'Custom::S3Clean',
        DependsOn: ['CFNInvokePolicy', 'HTTPSOnlyAssetBucketPolicy'],
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['S3Clean', 'Arn'] },
            Bucket: { Ref: 'AssetBucket' },
        },
    },
    AssetZipVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: {
                'Fn::Join': ['', [
                    { Ref: 'BootstrapPrefix' },
                    '/assets.zip',
                ]],
            },
            BuildDate: (new Date()).toISOString(),
        },
    },
    AssetUnzip: {
        Type: 'Custom::S3Unzip',
        DependsOn: ['AssetClean'],
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            SrcBucket: { Ref: 'BootstrapBucket' },
            Key: {
                'Fn::Join': ['', [
                    { Ref: 'BootstrapPrefix' },
                    '/assets.zip',
                ]],
            },
            DstBucket: { Ref: 'AssetBucket' },
            version: { Ref: 'AssetZipVersion' },
        },
    },
};
