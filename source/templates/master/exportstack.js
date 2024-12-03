/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = {
    ExportStack: {
        Type: 'AWS::CloudFormation::Stack',
        Properties: {
            TemplateURL: { 'Fn::Sub': 'https://${BootstrapBucket}.s3.${AWS::Region}.amazonaws.com/${BootstrapPrefix}/templates/export.json' },
            Parameters: {
                ContentDesignerOutputBucket: { Ref: 'ContentDesignerOutputBucket' },
                CFNLambda: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
                CFNInvokePolicy: { Ref: 'CFNInvokePolicy' },
                S3Clean: { 'Fn::GetAtt': ['S3Clean', 'Arn'] },
                BootstrapBucket: { Ref: 'BootstrapBucket' },
                BootstrapPrefix: { Ref: 'BootstrapPrefix' },
                VarIndex: { 'Fn::GetAtt': ['Var', 'QnaIndex'] },
                EsEndpoint: { 'Fn::GetAtt': ['ESVar', 'ESAddress'] },
                EsProxyLambda: { 'Fn::GetAtt': ['ESProxyLambda', 'Arn'] },
                ExportBucket: { Ref: 'ExportBucket' },
                VPCSubnetIdList: { 'Fn::Join': [',', { Ref: 'VPCSubnetIdList' }] },
                VPCSecurityGroupIdList: { 'Fn::Join': [',', { Ref: 'VPCSecurityGroupIdList' }] },
                XraySetting: { Ref: 'XraySetting' },
                Api: { Ref: 'API' },
                ApiRootResourceId: { 'Fn::GetAtt': ['API', 'RootResourceId'] },
                Stage: { Ref: 'Stage' },
                ApiDeploymentId: { Ref: 'Deployment' },
                KendraCrawlerSnsTopic: { Ref: 'KendraCrawlerSnsTopic' },
                DefaultQnABotSettings: { Ref: 'DefaultQnABotSettings' },
                PrivateQnABotSettings: { Ref: 'PrivateQnABotSettings' },
                CustomQnABotSettings: { Ref: 'CustomQnABotSettings' },
                AwsSdkLayerLambdaLayer: { Ref: 'AwsSdkLayerLambdaLayer' },
                QnABotCommonLambdaLayer: { Ref: 'QnABotCommonLambdaLayer' },
                LexVersion: 'V2',
                // Lex V2
                LexV2BotName: { 'Fn::GetAtt': ['LexV2Bot', 'botName'] },
                LexV2BotId: { 'Fn::GetAtt': ['LexV2Bot', 'botId'] },
                LexV2BotAlias: { 'Fn::GetAtt': ['LexV2Bot', 'botAlias'] },
                LexV2BotAliasId: { 'Fn::GetAtt': ['LexV2Bot', 'botAliasId'] },
                LexV2BotLocaleIds: { 'Fn::GetAtt': ['LexV2Bot', 'botLocaleIds'] },
                KendraFaqIndexId: { Ref: 'KendraFaqIndexId' },
                KendraWebPageIndexId: { Ref: 'KendraWebPageIndexId' },
                LogRetentionPeriod: { Ref: 'LogRetentionPeriod' },
            },
        },
    },
};
