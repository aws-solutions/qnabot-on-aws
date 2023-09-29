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
    Description: 'This template creates dev ElasticSearch Cluster',
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
