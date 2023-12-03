/*********************************************************************************************************************
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
 *********************************************************************************************************************/

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
                FeedbackFirehose: { 'Fn::GetAtt': ['FeedbackFirehose', 'Arn'] },
                FeedbackFirehoseName: { Ref: 'FeedbackFirehose' },
                CFNLambda: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
                CFNLambdaRole: { 'Fn::GetAtt': ['CFNLambdaRole', 'Arn'] },
                ApiUrlName: { 'Fn::GetAtt': ['ApiUrl', 'Name'] },
                AssetBucket: { Ref: 'AssetBucket' },
                FulfillmentLambdaRole: { Ref: 'FulfillmentLambdaRole' },
                QIDLambdaArn: { 'Fn::GetAtt': ['ESQidLambda', 'Arn'] },
                VPCSubnetIdList: { 'Fn::Join': [',', { Ref: 'VPCSubnetIdList' }] },
                VPCSecurityGroupIdList: { 'Fn::Join': [',', { Ref: 'VPCSecurityGroupIdList' }] },
                LexBotVersion: { Ref: 'LexBotVersion' },
                XraySetting: { Ref: 'XraySetting' },
                DefaultQnABotSettings: { Ref: 'DefaultQnABotSettings' },
                InstallLexResponseBots: { Ref: 'InstallLexResponseBots' },
                AwsSdkLayerLambdaLayer: { Ref: 'AwsSdkLayerLambdaLayer' },
            },
        },
    },
};
