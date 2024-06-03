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
    S3ClearCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/s3-clean.zip' },
            BuildDate: (new Date()).toISOString(),
        },
    },
    S3Clean: {
        Type: 'AWS::Lambda::Function',
        Metadata: { guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC') },
        Properties: {
            Code: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/s3-clean.zip' },
            },
            Environment: {
                Variables: {
                    ...util.getCommonEnvironmentVariables()
                },
            },
            Description: 'This function clears all S3 objects from the bucket of a given S3-based resource',
            Handler: 'lambda_function.handler',
            Role: {
                'Fn::GetAtt': ['CFNLambdaRole', 'Arn'],
            },
            Runtime: process.env.npm_package_config_pythonRuntime,
            VpcConfig: {
                'Fn::If': [
                    'VPCEnabled',
                    {
                        SubnetIds: { Ref: 'VPCSubnetIdList' },
                        SecurityGroupIds: { Ref: 'VPCSecurityGroupIdList' },
                    },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            TracingConfig: {
                'Fn::If': [
                    'XRAYEnabled',
                    { Mode: 'Active' },
                    { Ref: 'AWS::NoValue' },
                ],
            },
            Tags: [{
                Key: 'Type',
                Value: 'S3 Clean',
            }],
            Timeout: 300,
        },
    },
};
