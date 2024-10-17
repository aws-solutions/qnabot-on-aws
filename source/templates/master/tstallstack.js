/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = {
    TestAllStack: {
        Type: 'AWS::CloudFormation::Stack',
        Properties: {
            TemplateURL: { 'Fn::Sub': 'https://${BootstrapBucket}.s3.${AWS::Region}.amazonaws.com/${BootstrapPrefix}/templates/testall.json' },
            Parameters: {
                CFNLambda: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
                CFNInvokePolicy: { Ref: 'CFNInvokePolicy' },
                S3Clean: { 'Fn::GetAtt': ['S3Clean', 'Arn'] },
                LexV2BotId: { 'Fn::GetAtt': ['LexV2Bot', 'botId'] },
                LexV2BotAliasId: { 'Fn::GetAtt': ['LexV2Bot', 'botAliasId'] },
                BootstrapBucket: { Ref: 'BootstrapBucket' },
                BootstrapPrefix: { Ref: 'BootstrapPrefix' },
                VarIndex: { 'Fn::GetAtt': ['Var', 'QnaIndex'] },
                EsEndpoint: { 'Fn::GetAtt': ['ESVar', 'ESAddress'] },
                EsProxyLambda: { 'Fn::GetAtt': ['ESProxyLambda', 'Arn'] },
                TestAllBucket: { Ref: 'TestAllBucket' },
                ContentDesignerOutputBucket: { Ref: 'ContentDesignerOutputBucket' },
                VPCSubnetIdList: { 'Fn::Join': [',', { Ref: 'VPCSubnetIdList' }] },
                VPCSecurityGroupIdList: { 'Fn::Join': [',', { Ref: 'VPCSecurityGroupIdList' }] },
                XraySetting: { Ref: 'XraySetting' },
                AwsSdkLayerLambdaLayer: { Ref: 'AwsSdkLayerLambdaLayer' },
                CommonModulesLambdaLayer:{  Ref: 'CommonModulesLambdaLayer' },
                LogRetentionPeriod: { Ref: 'LogRetentionPeriod' },
            },
        },
    },
};
