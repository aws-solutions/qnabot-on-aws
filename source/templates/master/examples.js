/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = {
    ExamplesStack: {
        Type: 'AWS::CloudFormation::Stack',
        Condition: 'BuildExamples',
        Properties: {
            TemplateURL: { 'Fn::Sub': 'https://${BootstrapBucket}.s3.${AWS::Region}.amazonaws.com/${BootstrapPrefix}/templates/examples.json' },
            Parameters: {
                QnAType: { 'Fn::GetAtt': ['Var', 'QnAType'] },
                QuizType: { 'Fn::GetAtt': ['Var', 'QuizType'] },
                Index: { 'Fn::GetAtt': ['Var', 'QnaIndex'] },
                ESAddress: { 'Fn::GetAtt': ['ESVar', 'ESAddress'] },
                BootstrapBucket: { Ref: 'BootstrapBucket' },
                BootstrapPrefix: { Ref: 'BootstrapPrefix' },
                FeedbackKinesisFirehose: { 'Fn::GetAtt': ['FeedbackKinesisFirehose', 'Arn'] },
                FeedbackKinesisFirehoseName: { Ref: 'FeedbackKinesisFirehose' },
                CFNLambda: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
                CFNLambdaRole: { 'Fn::GetAtt': ['CFNLambdaRole', 'Arn'] },
                S3Clean: { 'Fn::GetAtt': ['S3Clean', 'Arn'] },
                ApiUrlName: { 'Fn::GetAtt': ['ApiUrl', 'Name'] },
                AssetBucket: { Ref: 'AssetBucket' },
                FulfillmentLambdaRole: { Ref: 'FulfillmentLambdaRole' },
                QIDLambdaArn: { 'Fn::GetAtt': ['ESQidLambda', 'Arn'] },
                VPCSubnetIdList: { 'Fn::Join': [',', { Ref: 'VPCSubnetIdList' }] },
                VPCSecurityGroupIdList: { 'Fn::Join': [',', { Ref: 'VPCSecurityGroupIdList' }] },
                XraySetting: { Ref: 'XraySetting' },
                DefaultQnABotSettings: { Ref: 'DefaultQnABotSettings' },
                PrivateQnABotSettings: { Ref: 'PrivateQnABotSettings' },
                InstallLexResponseBots: { Ref: 'InstallLexResponseBots' },
                AwsSdkLayerLambdaLayer: { Ref: 'AwsSdkLayerLambdaLayer' },
                LogRetentionPeriod: { Ref: 'LogRetentionPeriod' },
            },
        },
    },
};
