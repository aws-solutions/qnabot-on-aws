/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = {
    StreamingStack: {
        Type: 'AWS::CloudFormation::Stack',
        Condition: 'StreamingEnabled',
        Properties: {
            TemplateURL: { 'Fn::Sub': 'https://${BootstrapBucket}.s3.${AWS::Region}.amazonaws.com/${BootstrapPrefix}/templates/streaming.json' },
            Parameters: {
                CFNLambda: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
                CFNInvokePolicy: { Ref: 'CFNInvokePolicy' },
                S3Clean: { 'Fn::GetAtt': ['S3Clean', 'Arn'] },
                BootstrapBucket: { Ref: 'BootstrapBucket' },
                BootstrapPrefix: { Ref: 'BootstrapPrefix' },
                LogRetentionPeriod: { Ref: 'LogRetentionPeriod' },
                XraySetting: { Ref: 'XraySetting' },
                VPCSubnetIdList: { 'Fn::Join': [',', { Ref: 'VPCSubnetIdList' }] },
                VPCSecurityGroupIdList: { 'Fn::Join': [',', { Ref: 'VPCSecurityGroupIdList' }] },
            },
        },
    },
};
