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
const path = require('path');

const util = require('../../util');

module.exports = {
    ESInfo: {
        Type: 'Custom::ESProxy',
        Condition: 'DontCreateDomain',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['ESProxyLambda', 'Arn'] },
            name: { Ref: 'ElasticsearchName' },
        },
    },
    ESInfoLambda: {
        Type: 'AWS::Lambda::Function',
        Condition: 'DontCreateDomain',
        Properties: {
            Code: {
                ZipFile: fs.readFileSync(`${__dirname}/handler.js`, 'utf-8'),
            },
            Handler: 'index.handler',
            MemorySize: '128',
            Role: { 'Fn::GetAtt': ['ESProxyLambdaRole', 'Arn'] },
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
                Value: 'CustomResource',
            }],
        },
        Metadata: util.cfnNag(['W92']),
    },
};
