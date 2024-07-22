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

/* eslint-disable quotes */
/* eslint-disable indent */
const fs = require('fs');
const util = require('../util');

module.exports = {
    TestAllCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { Ref: 'CFNLambda' },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/testall.zip' },
            BuildDate: new Date().toISOString(),
        },
    },
    TestAllStepLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/testall.zip' },
                S3ObjectVersion: { Ref: 'TestAllCodeVersion' },
            },
            Environment: {
                Variables: {
                    ES_INDEX: { Ref: 'VarIndex' },
                    ES_ENDPOINT: { Ref: 'EsEndpoint' },
                    ES_PROXY: { Ref: 'EsProxyLambda' },
                    LEXV2_BOT_ID: { Ref: 'LexV2BotId' },
                    LEXV2_BOT_ALIAS_ID: { Ref: 'LexV2BotAliasId' },
                    ...util.getCommonEnvironmentVariables()
                },
            },
            Handler: 'index.step',
            MemorySize: '1280',
            Role: { 'Fn::GetAtt': ['TestAllRole', 'Arn'] },
            Runtime: process.env.npm_package_config_lambdaRuntime,
            Timeout: 900,
            VpcConfig: {
                'Fn::If': [
                    'VPCEnabled',
                    {
                        SubnetIds: { 'Fn::Split': [',', { Ref: 'VPCSubnetIdList' }] },
                        SecurityGroupIds: { 'Fn::Split': [',', { Ref: 'VPCSecurityGroupIdList' }] },
                    },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            TracingConfig: {
                'Fn::If': ['XRAYEnabled', { Mode: 'Active' }, { Ref: 'AWS::NoValue' }],
            },
            Layers: [
                { Ref: 'AwsSdkLayerLambdaLayer' },
                { Ref: 'CommonModulesLambdaLayer' }
            ],
            Tags: [
                {
                    Key: 'Type',
                    Value: 'TestAll',
                },
            ],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    },
    TestAllRole: {
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
            Path: '/',
            Policies: [
                util.basicLambdaExecutionPolicy(),
                util.lambdaVPCAccessExecutionRole(),
                util.xrayDaemonWriteAccess(),
                {
                    PolicyName: 'TestAllPolicy',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Action: [
                                    's3:PutObject',
                                    's3:GetObject',
                                    's3:GetObjectVersion',
                                    's3:DeleteObject',
                                    's3:DeleteObjectVersion',
                                ],
                                Resource: [{ 'Fn::Sub': 'arn:aws:s3:::${TestAllBucket}*' }],
                            },
                            {
                                Effect: 'Allow',
                                Action: ['lambda:InvokeFunction'],
                                Resource: [{ Ref: 'EsProxyLambda' }],
                            },
                            {
                                Effect: 'Allow',
                                Action: ['lex:RecognizeText'],
                                Resource: [
                                    {
                                        'Fn::Sub':
                                            'arn:${AWS::Partition}:lex:${AWS::Region}:${AWS::AccountId}:bot-alias/*/*',
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W11', 'W12']),
            guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK'),
        },
    },
    TestAllClean: {
        Type: 'Custom::S3Clean',
        Properties: {
            ServiceToken: { Ref: 'S3Clean' },
            Bucket: { Ref: 'TestAllBucket' },
        },
    },
};
