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
    Bucket: {
        Type: 'AWS::S3::Bucket',
        Metadata: { guard: util.cfnGuard('S3_BUCKET_NO_PUBLIC_RW_ACL') },
        DependsOn : ['MainAccessLogBucket', 'MainAccessLogsBucketPolicy'],
        DeletionPolicy: 'Delete',
        Properties: {
            VersioningConfiguration: {
                Status: 'Enabled',
            },
            WebsiteConfiguration: {
                IndexDocument: 'index.html',
            },
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true,
            },
            LoggingConfiguration: {
                DestinationBucketName: { Ref: 'MainAccessLogBucket' },
                LogFilePrefix: {"Fn::Join": ["", [{Ref: 'MainAccessLogBucket'},"/S3Bucket/"]]},
             },         
            BucketEncryption: {
                ServerSideEncryptionConfiguration: [{
                    ServerSideEncryptionByDefault: {
                        SSEAlgorithm: 'AES256',
                    },
                }],
            },
        },
    },
    HTTPSOnlyBucketPolicy: util.httpsOnlyBucketPolicy(),
    Clean: {
        Type: 'Custom::S3Clean',
        DependsOn: ['CFNInvokePolicy', 'HTTPSOnlyBucketPolicy'],
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['S3Clean', 'Arn'] },
            Bucket: { Ref: 'Bucket' },
        },
    },
    Unzip: {
        Type: 'Custom::S3Unzip',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            SrcBucket: { Ref: 'BootstrapBucket' },
            Key: {
                'Fn::Join': ['', [
                    { Ref: 'BootstrapPrefix' },
                    '/website.zip',
                ]],
            },
            DstBucket: { Ref: 'Bucket' },
            buildDate: new Date(),
        },
        DependsOn: 'Clean',
    },
    S3AccessRole: {
        Type: 'AWS::IAM::Role',
        Metadata: { guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK') },
        Properties: {
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'apigateway.amazonaws.com',
                        },
                        Action: 'sts:AssumeRole',
                    },
                ],
            },
            Path: '/',
            Policies: [{
                PolicyName: 'S3AccessPolicy',
                PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Action: [
                            's3:GetObject',
                        ],
                        Resource: [
                            { 'Fn::Sub': 'arn:aws:s3:::${ImportBucket}/*' },
                            { 'Fn::Sub': 'arn:aws:s3:::${ExportBucket}/*' },
                            { 'Fn::Sub': 'arn:aws:s3:::${TestAllBucket}/*' },
                            { 'Fn::Sub': 'arn:aws:s3:::${Bucket}/*' },
                            { 'Fn::Sub': 'arn:aws:s3:::${AssetBucket}/*' },
                        ],
                    }, {
                        Effect: 'Allow',
                        Action: [
                            's3:PutObject',
                        ],
                        Resource: [
                            { 'Fn::Sub': 'arn:aws:s3:::${ExportBucket}/*' },
                            { 'Fn::Sub': 'arn:aws:s3:::${TestAllBucket}/*' },
                        ],
                    }, {
                        Effect: 'Allow',
                        Action: [
                            's3:DeleteObject',
                        ],
                        Resource: [
                            { 'Fn::Sub': 'arn:aws:s3:::${ImportBucket}/*' },
                            { 'Fn::Sub': 'arn:aws:s3:::${ExportBucket}/*' },
                            { 'Fn::Sub': 'arn:aws:s3:::${TestAllBucket}/*' },
                        ],
                    },
                    ],
                },
            }],
        },
    },
};
