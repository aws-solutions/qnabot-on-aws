/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const _ = require('lodash');
const resources = require('./resources');
const outputs = require('./outputs');

module.exports = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: `(SO0189n-streaming) This template deploys resources to allow streaming responses - Version v${process.env.npm_package_version}`,
    Parameters: {
        CFNLambda: { Type: 'String' },
        CFNInvokePolicy: { Type: 'String' },
        S3Clean: { Type: 'String' },
        BootstrapBucket: { Type: 'String' },
        BootstrapPrefix: { Type: 'String' },
        LogRetentionPeriod: { Type: 'Number' },
        XraySetting: { Type: 'String' },
        VPCSubnetIdList: { Type: 'String' },
        VPCSecurityGroupIdList: { Type: 'String' },
    },
    Conditions: {
        VPCEnabled: { 'Fn::Not': [{ 'Fn::Equals': ['', { Ref: 'VPCSecurityGroupIdList' }] }] },
        XRAYEnabled: { 'Fn::Equals': [{ Ref: 'XraySetting' }, 'TRUE'] },
        LogRetentionPeriodIsNotZero: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'LogRetentionPeriod' }, 0] }] }
    },
    Resources: _.merge({}, resources),
    Outputs: _.merge({}, outputs)
};
