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

const examples = require('./examples');
const extensions = require('./extensions');

const resources = Object.assign(examples, extensions);
const outputs1 = require('./outputs').outputs;
const outputs2 = require('./examples/responsebots-lexv2').outputs;

const outputSNSTopic = { FeedbackSNSTopic: { Value: { 'Fn::GetAtt': ['FeedbackSNS', 'TopicName'] } } };
const outputs = Object.assign(outputs1, outputs2, outputSNSTopic);

module.exports = {
    Resources: resources,
    AWSTemplateFormatVersion: '2010-09-09',
    Description: `(SO0189n-example) QnABot nested example resources - Version v${process.env.npm_package_version}`,
    Mappings: {},
    Outputs: outputs,
    Parameters: {
        FulfillmentLambdaRole: { Type: 'String' },
        QnAType: { Type: 'String' },
        QuizType: { Type: 'String' },
        Index: { Type: 'String' },
        ESAddress: { Type: 'String' },
        BootstrapBucket: { Type: 'String' },
        BootstrapPrefix: { Type: 'String' },
        FeedbackKinesisFirehose: { Type: 'String' },
        FeedbackKinesisFirehoseName: { Type: 'String' },
        CFNLambda: { Type: 'String' },
        CFNLambdaRole: { Type: 'String' },
        S3Clean: { Type: 'String' },
        ApiUrlName: { Type: 'String' },
        AssetBucket: { Type: 'String' },
        QIDLambdaArn: { Type: 'String' },
        VPCSubnetIdList: { Type: 'String' },
        VPCSecurityGroupIdList: { Type: 'String' },
        LexBotVersion: { Type: 'String' },
        XraySetting: { Type: 'String' },
        DefaultQnABotSettings: { Type: 'String' },
        PrivateQnABotSettings: { Type: 'String' },
        InstallLexResponseBots: { Type: 'String' },
        AwsSdkLayerLambdaLayer: { Type: 'String' },
    },
    Conditions: {
        VPCEnabled: {
            'Fn::Not': [
                { 'Fn::Equals': ['', { Ref: 'VPCSecurityGroupIdList' }] },
            ],
        },
        XRAYEnabled: { 'Fn::Equals': [{ Ref: 'XraySetting' }, 'TRUE'] },
        CreateLexV1Bots: { 'Fn::Equals': [{ Ref: 'LexBotVersion' }, 'LexV1 and LexV2'] },
        CreateLexResponseBots: { 'Fn::Equals': [{ Ref: 'InstallLexResponseBots' }, 'true'] },
        CreateLexV1ResponseBots: { 'Fn::And': [{ Condition: 'CreateLexResponseBots' }, { Condition: 'CreateLexV1Bots' }] },
    },
};
