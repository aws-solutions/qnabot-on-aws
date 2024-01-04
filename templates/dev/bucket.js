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
        Description: 'This template creates dev ElasticSearch Cluster',
        Resources: {
            Bucket: {
                Type: 'AWS::S3::Bucket',
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
                    PublicAccessBlockConfiguration: {
                        BlockPublicAcls: true,
                        BlockPublicPolicy: true,
                        IgnorePublicAcls: true,
                        RestrictPublicBuckets: true,
                    },
                },
                Metadata: util.cfnNag(['W35']),
            },
            Clear: {
                Type: 'Custom::S3Clear',
                DependsOn: ['CFNLambdaPolicy'],
                Properties: {
                    ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
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
                        }
                    },  
                    Handler: 'index.handler',
                    MemorySize: '128',
                    Role: { 'Fn::GetAtt': ['CFNLambdaRole', 'Arn'] },
                    Runtime: process.env.npm_package_config_lambdaRuntime,
                    Timeout: 60,
                },
                Metadata: util.cfnNag(['W92']),
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
                Metadata: util.cfnNag(['W11', 'F3']),
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
