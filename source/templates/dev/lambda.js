/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const util = require('../util');

module.exports = {
    Description: 'This template creates dev OpenSearch Cluster',
    Resources: {
        InvokePermission: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
                Action: 'lambda:InvokeFunction',
                FunctionName: { 'Fn::GetAtt': ['Lambda', 'Arn'] },
                Principal: { Ref: 'AWS::AccountId' },
            },
        },
        Lambda: {
            Type: 'AWS::Lambda::Function',
            Metadata: { guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC') },
            Properties: {
                Code: {
                    ZipFile: {
                        'Fn::Join': ['\n', [
                            'exports.handler=function(event,context,callback){',
                            '   console.log(JSON.stringify(event,null,2))',
                            '   callback(null,event)',
                            '}',
                        ]],
                    },
                },
                Handler: 'index.handler',
                MemorySize: '128',
                Role: { 'Fn::GetAtt': ['LambdaRole', 'Arn'] },
                Runtime: process.env.npm_package_config_lambdaRuntime,
                Timeout: 300,
            },
        },
        LambdaRole: {
            Type: 'AWS::IAM::Role',
            Metadata: { guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK') },
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
            },
        },
    },
    Outputs: {
        lambda: {
            Value: { 'Fn::GetAtt': ['Lambda', 'Arn'] },
        },
    },
};
