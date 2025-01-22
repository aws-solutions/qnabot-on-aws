/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
        XraySetting: { Type: 'String' },
        InstallLexResponseBots: { Type: 'String' },
        AwsSdkLayerLambdaLayer: { Type: 'String' },
        LogRetentionPeriod: { Type: 'Number' },
    },
    Conditions: {
        VPCEnabled: {
            'Fn::Not': [
                { 'Fn::Equals': ['', { Ref: 'VPCSecurityGroupIdList' }] },
            ],
        },
        XRAYEnabled: { 'Fn::Equals': [{ Ref: 'XraySetting' }, 'TRUE'] },
        CreateLexResponseBots: { 'Fn::Equals': [{ Ref: 'InstallLexResponseBots' }, 'true'] },
        LogRetentionPeriodIsNotZero: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'LogRetentionPeriod' }, 0] }] },
    },
};
