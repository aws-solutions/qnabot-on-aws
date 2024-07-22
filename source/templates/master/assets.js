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
        Condition: 'BuildExamples',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['S3Clean', 'Arn'] },
            Bucket: { Ref: 'AssetBucket' },
        },
    },
    AssetZipVersion: {
        Condition: 'BuildExamples',
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
        Condition: 'BuildExamples',
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
