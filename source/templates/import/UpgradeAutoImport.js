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
    PostUpgradeImport: {
        Type: 'Custom::PostUpgradeImport',
        DependsOn: ['ImportStepLambda'],
        Properties: {
            ServiceToken: { Ref: 'CFNLambda' },
            importbucket: { Ref: 'ImportBucket' },
            exportbucket: { Ref: 'ExportBucket' },
            contentDesignerOutputBucket : { Ref: 'ContentDesignerOutputBucket' },
            id: exportfile,
            index: { Ref: 'VarIndex' },
            es_endpoint: { Ref: 'EsEndpoint' },
            POST_UPGRADE_IMPORT_TRIGGERS: { 'Fn::Sub': '${EmbeddingsApi} ${EmbeddingsBedrockModelId} ${EmbeddingsLambdaDimensions} ${EmbeddingsLambdaArn}' },
        },
    },
    PostUpgradeImportMetrics: {
        Type: 'Custom::PostUpgradeImport',
        DependsOn: ['ImportStepLambda'],
        Properties: {
            ServiceToken: { Ref: 'CFNLambda' },
            importbucket: { Ref: 'ImportBucket' },
            exportbucket: { Ref: 'ExportBucket' },
            contentDesignerOutputBucket : { Ref: 'ContentDesignerOutputBucket' },
            id: exportfile_metrics,
            index: { Ref: 'MetricsIndex' },
            es_endpoint: { Ref: 'EsEndpoint' },
        },
    },
    PostUpgradeImportFeedback: {
        Type: 'Custom::PostUpgradeImport',
        DependsOn: ['ImportStepLambda'],
        Properties: {
            ServiceToken: { Ref: 'CFNLambda' },
            importbucket: { Ref: 'ImportBucket' },
            exportbucket: { Ref: 'ExportBucket' },
            contentDesignerOutputBucket : { Ref: 'ContentDesignerOutputBucket' },
            id: exportfile_feedback,
            index: { Ref: 'FeedbackIndex' },
            es_endpoint: { Ref: 'EsEndpoint' },
        },
    },
};
