/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const fs = require('fs');
const _ = require('lodash');

const files = [
    require('./bucket'),
    require('./resources'),
];

module.exports = {
    Resources: _.assign.apply({}, files),
    AWSTemplateFormatVersion: '2010-09-09',
    Description: `(SO0189n-export) QnABot nested export resources - Version v${process.env.npm_package_version}`,
    Outputs: require('./outputs'),
    Parameters: {
        ContentDesignerOutputBucket: { Type: 'String' },
        CFNLambda: { Type: 'String' },
        CFNInvokePolicy: { Type: 'String' },
        S3Clean: { Type: 'String' },
        BootstrapBucket: { Type: 'String' },
        BootstrapPrefix: { Type: 'String' },
        VarIndex: { Type: 'String' },
        EsEndpoint: { Type: 'String' },
        EsProxyLambda: { Type: 'String' },
        ExportBucket: { Type: 'String' },
        LexVersion: { Type: 'String' },
        // Lex V2
        LexV2BotName: { Type: 'String' },
        LexV2BotId: { Type: 'String' },
        LexV2BotAlias: { Type: 'String' },
        LexV2BotAliasId: { Type: 'String' },
        LexV2BotLocaleIds: { Type: 'String' },
        Api: { Type: 'String' },
        ApiRootResourceId: { Type: 'String' },
        Stage: { Type: 'String' },
        ApiDeploymentId: { Type: 'String' },
        VPCSubnetIdList: { Type: 'String' },
        VPCSecurityGroupIdList: { Type: 'String' },
        XraySetting: { Type: 'String' },
        AwsSdkLayerLambdaLayer: { Type: 'String' },
        QnABotCommonLambdaLayer: { Type: 'String' },
        KendraFaqIndexId: { Type: 'String' },
        KendraWebPageIndexId: { Type: 'String' },
        LogRetentionPeriod: { Type: 'Number' },
        SettingsTable: { Type: 'String' },
    },
    Conditions: {
        VPCEnabled: {
            'Fn::Not': [
                { 'Fn::Equals': ['', { Ref: 'VPCSecurityGroupIdList' }] },
            ],
        },
        XRAYEnabled: { 'Fn::Equals': [{ Ref: 'XraySetting' }, 'TRUE'] },
        CreateKendraSyncPolicy: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'KendraFaqIndexId' }, ''] }] },
        CreateKendraCrawlerPolicy: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'KendraWebPageIndexId' }, ''] }] },
        LogRetentionPeriodIsNotZero: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'LogRetentionPeriod' }, 0] }] }
    },
};
