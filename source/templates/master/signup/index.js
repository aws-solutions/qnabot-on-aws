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

const fs = require('fs');
const util = require('../../util');

module.exports = {
    SignupPermision: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            Action: 'lambda:InvokeFunction',
            FunctionName: { 'Fn::GetAtt': ['SignupLambda', 'Arn'] },
            Principal: 'cognito-idp.amazonaws.com',
            SourceArn: { 'Fn::GetAtt': ['UserPool', 'Arn'] },
        },
    },
    MessagePermision: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            Action: 'lambda:InvokeFunction',
            FunctionName: { 'Fn::GetAtt': ['MessageLambda', 'Arn'] },
            Principal: 'cognito-idp.amazonaws.com',
            SourceArn: { 'Fn::GetAtt': ['UserPool', 'Arn'] },
        },
    },
    MessageLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                ZipFile: fs.readFileSync(`${__dirname}/message.js`, 'utf8'),
            },
            Handler: 'index.handler',
            MemorySize: '128',
            Environment: {
                Variables: {
                    APPROVED_DOMAIN: {
                        'Fn::If': [
                            'Domain',
                            { Ref: 'ApprovedDomain' },
                            { Ref: 'AWS::NoValue' },
                        ],
                    },
                },
            },
            Role: {
                'Fn::GetAtt': [
                    'SignupLambdaRole',
                    'Arn',
                ],
            },
            Runtime: process.env.npm_package_config_lambdaRuntime,
            Timeout: 300,
            VpcConfig: {
                'Fn::If': ['VPCEnabled', {
                    SubnetIds: { Ref: 'VPCSubnetIdList' },
                    SecurityGroupIds: { Ref: 'VPCSecurityGroupIdList' },
                }, { Ref: 'AWS::NoValue' }],
            },
            TracingConfig: {
                'Fn::If': ['XRAYEnabled', { Mode: 'Active' },
                    { Ref: 'AWS::NoValue' }],
            },
            Layers: [
                { Ref: 'AwsSdkLayerLambdaLayer' },
            ],
            Tags: [{
                Key: 'Type',
                Value: 'Cognito',
            }],

        },
        Metadata: {
            cfn_nag: util.cfnNag(['W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    },
    SignupLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            Code: {
                ZipFile: fs.readFileSync(`${__dirname}/signup.js`, 'utf8'),
            },
            Handler: 'index.handler',
            MemorySize: '128',
            Environment: {
                Variables: {
                    APPROVED_DOMAIN: {
                        'Fn::If': [
                            'Domain',
                            { Ref: 'ApprovedDomain' },
                            { Ref: 'AWS::NoValue' },
                        ],
                    },
                },
            },
            Role: {
                'Fn::GetAtt': [
                    'SignupLambdaRole',
                    'Arn',
                ],
            },
            Runtime: process.env.npm_package_config_lambdaRuntime,
            Timeout: 300,
            VpcConfig: {
                'Fn::If': ['VPCEnabled', {
                    SubnetIds: { Ref: 'VPCSubnetIdList' },
                    SecurityGroupIds: { Ref: 'VPCSecurityGroupIdList' },
                }, { Ref: 'AWS::NoValue' }],
            },
            TracingConfig: {
                'Fn::If': ['XRAYEnabled', { Mode: 'Active' },
                    { Ref: 'AWS::NoValue' }],
            },
            Layers: [
                { Ref: 'AwsSdkLayerLambdaLayer' },
            ],
            Tags: [{
                Key: 'Type',
                Value: 'Cognito',
            }],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC'),
        },
    },
    SignupLambdaRole: {
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
            ],
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W11', 'W12']),
            guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK'),
        },
    },
};
