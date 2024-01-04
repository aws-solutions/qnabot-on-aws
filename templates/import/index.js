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
const _ = require('lodash');

const files = fs
    .readdirSync(`${__dirname}`)
    .filter(
        (x) => !x.match(
            /README.md|Makefile|index|test|outputs|coverage|__snapshots__|index.test.js|jest.config.js|.DS_Store/,
        ),
    )
    .map((x) => require(`./${x}`));

module.exports = {
    Resources: _.assign.apply({}, files),
    AWSTemplateFormatVersion: '2010-09-09',
    Description: `(SO0189n-import) QnABot nested import resources - Version v${process.env.npm_package_version}`,
    Outputs: require('./outputs'),
    Parameters: {
        CFNLambda: { Type: 'String' },
        CFNInvokePolicy: { Type: 'String' },
        BootstrapBucket: { Type: 'String' },
        BootstrapPrefix: { Type: 'String' },
        EsEndpoint: { Type: 'String' },
        EsArn: { Type: 'String' },
        EsProxyLambda: { Type: 'String' },
        ImportBucket: { Type: 'String' },
        ExportBucket: { Type: 'String' },
        VarIndex: { Type: 'String' },
        MetricsIndex: { Type: 'String' },
        FeedbackIndex: { Type: 'String' },
        DefaultQnABotSettings: { Type: 'String' },
        CustomQnABotSettings: { Type: 'String' },
        Encryption: { Type: 'String' },
        VPCSubnetIdList: { Type: 'String' },
        VPCSecurityGroupIdList: { Type: 'String' },
        XraySetting: { Type: 'String' },
        EmbeddingsLambdaArn: { Type: 'String' },
        EmbeddingsApi: { Type: 'String' },
        EmbeddingsLambdaDimensions: { Type: 'String' },
        EmbeddingsSagemakerEndpoint: { Type: 'String' },
        EmbeddingsSagemakerEndpointArn: { Type: 'String' },
        AwsSdkLayerLambdaLayer: { Type: 'String' },
        CommonModulesLambdaLayer: { Type: 'String' },
        EsProxyLambdaLayer: { Type: 'String' },
        QnABotCommonLambdaLayer: { Type: 'String' },
    },
    Conditions: {
        VPCEnabled: {
            'Fn::Not': [{ 'Fn::Equals': ['', { Ref: 'VPCSecurityGroupIdList' }] }],
        },
        XRAYEnabled: { 'Fn::Equals': [{ Ref: 'XraySetting' }, 'TRUE'] },
        EmbeddingsLambdaArn: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'EmbeddingsLambdaArn' }, ''] }] },
        EmbeddingsSagemaker: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'EmbeddingsSagemakerEndpointArn' }, ''] }] },
    },
};
