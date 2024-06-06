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

module.exports = {
    ImportStack: {
        Type: 'AWS::CloudFormation::Stack',
        DependsOn: ['PreUpgradeExport'],
        Properties: {
            TemplateURL: { 'Fn::Sub': 'https://${BootstrapBucket}.s3.${AWS::Region}.amazonaws.com/${BootstrapPrefix}/templates/import.json' },
            Parameters: {
                CFNLambda: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
                CFNInvokePolicy: { Ref: 'CFNInvokePolicy' },
                S3Clean: { 'Fn::GetAtt': ['S3Clean', 'Arn'] },
                BootstrapBucket: { Ref: 'BootstrapBucket' },
                BootstrapPrefix: { Ref: 'BootstrapPrefix' },
                EsEndpoint: { 'Fn::GetAtt': ['ESVar', 'ESAddress'] },
                EsArn: { 'Fn::GetAtt': ['ESVar', 'ESArn'] },
                EsProxyLambda: { 'Fn::GetAtt': ['ESProxyLambda', 'Arn'] },
                ImportBucket: { Ref: 'ImportBucket' },
                ExportBucket: { Ref: 'ExportBucket' },
                VarIndex: { 'Fn::GetAtt': ['Var', 'QnaIndex'] },
                MetricsIndex: { 'Fn::GetAtt': ['Var', 'MetricsIndex'] },
                FeedbackIndex: { 'Fn::GetAtt': ['Var', 'FeedbackIndex'] },
                DefaultQnABotSettings: { Ref: 'DefaultQnABotSettings' },
                PrivateQnABotSettings: { Ref: 'PrivateQnABotSettings' },
                CustomQnABotSettings: { Ref: 'CustomQnABotSettings' },
                VPCSubnetIdList: { 'Fn::Join': [',', { Ref: 'VPCSubnetIdList' }] },
                VPCSecurityGroupIdList: { 'Fn::Join': [',', { Ref: 'VPCSecurityGroupIdList' }] },
                XraySetting: { Ref: 'XraySetting' },
                AwsSdkLayerLambdaLayer: { Ref: 'AwsSdkLayerLambdaLayer' },
                CommonModulesLambdaLayer: { Ref: 'CommonModulesLambdaLayer' },
                EsProxyLambdaLayer: { Ref: 'EsProxyLambdaLayer' },
                QnABotCommonLambdaLayer: { Ref: 'QnABotCommonLambdaLayer' },
                EmbeddingsLambdaArn: { Ref: 'EmbeddingsLambdaArn' },
                EmbeddingsApi: { Ref: 'EmbeddingsApi' },
                EmbeddingsLambdaDimensions: { Ref: 'EmbeddingsLambdaDimensions' },
                EmbeddingsSagemakerEndpoint: {
                    'Fn::If': [
                        'EmbeddingsSagemaker',
                        { 'Fn::GetAtt': ['SagemakerEmbeddingsStack', 'Outputs.EmbeddingsSagemakerEndpoint'] },
                        '',
                    ],
                },
                EmbeddingsSagemakerEndpointArn: {
                    'Fn::If': [
                        'EmbeddingsSagemaker',
                        { 'Fn::GetAtt': ['SagemakerEmbeddingsStack', 'Outputs.EmbeddingsSagemakerEndpointArn'] },
                        '',
                    ],
                },
                EmbeddingsBedrockModelId: { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'EmbeddingsBedrockModelId'}, 'ModelID'] },
            },
        },
    },
};
