/*********************************************************************************************************************
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
 *********************************************************************************************************************/

const util = require('../util');

module.exports = {
    Bucket: {
        Type: 'AWS::S3::Bucket',
        DeletionPolicy: 'Delete',
        Properties: {
            WebsiteConfiguration: {
                IndexDocument: 'index.html',
            },
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true,
            },
            BucketEncryption: {
                'Fn::If': [
                    'Encrypted',
                    {
                        ServerSideEncryptionConfiguration: [{
                            ServerSideEncryptionByDefault: {
                                SSEAlgorithm: 'AES256',
                            },
                        }],
                    },
                    {
                        Ref: 'AWS::NoValue',
                    },
                ],
            },
        },
        Metadata: util.cfnNag(['W35']),
    },
    HTTPSOnlyBucketPolicy: util.httpsOnlyBucketPolicy(),
    Clear: {
        Type: 'Custom::S3Clear',
        DependsOn: ['CFNInvokePolicy'],
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
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
        DependsOn: 'Clear',
    },
    S3AccessRole: {
        Type: 'AWS::IAM::Role',
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
