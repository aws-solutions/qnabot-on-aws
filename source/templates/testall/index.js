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
    Description: `(SO0189n-testall) QnABot nested testall resources - Version v${process.env.npm_package_version}`,
    Outputs: require('./outputs'),
    Parameters: {
        CFNLambda: { Type: 'String' },
        CFNInvokePolicy: { Type: 'String' },
        S3Clean: { Type: 'String' },
        LexV2BotId: { Type: 'String' },
        LexV2BotAliasId: { Type: 'String' },
        LogRetentionPeriod: { Type: 'Number' },
        BootstrapBucket: { Type: 'String' },
        BootstrapPrefix: { Type: 'String' },
        VarIndex: { Type: 'String' },
        EsEndpoint: { Type: 'String' },
        EsProxyLambda: { Type: 'String' },
        TestAllBucket: { Type: 'String' },
        ContentDesignerOutputBucket: { Type: 'String' },
        VPCSubnetIdList: { Type: 'String' },
        VPCSecurityGroupIdList: { Type: 'String' },
        XraySetting: { Type: 'String' },
        AwsSdkLayerLambdaLayer: { Type: 'String' },
        CommonModulesLambdaLayer: { Type: 'String' },
    },
    Conditions: {
        VPCEnabled: { 'Fn::Not': [{ 'Fn::Equals': ['', { Ref: 'VPCSecurityGroupIdList' }] }] },
        XRAYEnabled: { 'Fn::Equals': [{ Ref: 'XraySetting' }, 'TRUE'] },
        LogRetentionPeriodIsNotZero: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'LogRetentionPeriod' }, 0] }] }
    },
};
