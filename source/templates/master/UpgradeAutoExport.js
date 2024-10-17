/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

// Filenames must match across:
// aws-ai-qna-bot/templates/import/UpgradeAutoImport.js
// aws-ai-qna-bot/templates/master/UpgradeAutoExport.js
// and pattern in /aws-ai-qna-bot/lambda/import/index.js
const exportfile = `ExportAll_QnABot_v${process.env.npm_package_version}.json`;
const exportfile_metrics = `ExportAll_QnABot_v${process.env.npm_package_version}_metrics.json`;
const exportfile_feedback = `ExportAll_QnABot_v${process.env.npm_package_version}_feedback.json`;

module.exports = {
    PreUpgradeExport: {
        Type: 'Custom::PreUpgradeExport',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            bucket: { Ref: 'ExportBucket' },
            contentDesignerOutputBucket : { Ref: 'ContentDesignerOutputBucket' },
            id: exportfile,
            index: { 'Fn::Sub': '${Var.QnaIndex}' },
            PRE_UPGRADE_EXPORT_TRIGGERS: {
                'Fn::Sub': [
                    '${EmbeddingsApi} ${EmbeddingsBedrockModelId} ${EmbeddingsLambdaDimensions} ${EmbeddingsLambdaArn} ${SMEmbeddingEndpoint}',
                    {
                        SMEmbeddingEndpoint: {
                            'Fn::If': [
                                'EmbeddingsSagemaker',
                                { 'Fn::GetAtt': ['SagemakerEmbeddingsStack', 'Outputs.EmbeddingsSagemakerEndpoint'] },
                                '',
                            ],
                        },
                    },
                ],
            },
        },
    },
    PreUpgradeExportMetrics: {
        Type: 'Custom::PreUpgradeExport',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            bucket: { Ref: 'ExportBucket' },
            contentDesignerOutputBucket : { Ref: 'ContentDesignerOutputBucket' },
            id: exportfile_metrics,
            index: { 'Fn::Sub': '${Var.MetricsIndex}' },
            PRE_UPGRADE_EXPORT_TRIGGERS: {
                'Fn::Sub': [
                    '${EmbeddingsApi} ${EmbeddingsBedrockModelId} ${EmbeddingsLambdaDimensions} ${EmbeddingsLambdaArn} ${SMEmbeddingEndpoint}',
                    {
                        SMEmbeddingEndpoint: {
                            'Fn::If': [
                                'EmbeddingsSagemaker',
                                { 'Fn::GetAtt': ['SagemakerEmbeddingsStack', 'Outputs.EmbeddingsSagemakerEndpoint'] },
                                '',
                            ],
                        },
                    },
                ],
            },
        },
    },
    PreUpgradeExportFeedback: {
        Type: 'Custom::PreUpgradeExport',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            bucket: { Ref: 'ExportBucket' },
            contentDesignerOutputBucket : { Ref: 'ContentDesignerOutputBucket' },
            id: exportfile_feedback,
            index: { 'Fn::Sub': '${Var.FeedbackIndex}' },
            PRE_UPGRADE_EXPORT_TRIGGERS: {
                'Fn::Sub': [
                    '${EmbeddingsApi} ${EmbeddingsBedrockModelId} ${EmbeddingsLambdaDimensions} ${EmbeddingsLambdaArn} ${SMEmbeddingEndpoint}',
                    {
                        SMEmbeddingEndpoint: {
                            'Fn::If': [
                                'EmbeddingsSagemaker',
                                { 'Fn::GetAtt': ['SagemakerEmbeddingsStack', 'Outputs.EmbeddingsSagemakerEndpoint'] },
                                '',
                            ],
                        },
                    },
                ],
            },
        },
    },
};
