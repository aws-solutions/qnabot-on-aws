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
            POST_UPGRADE_IMPORT_TRIGGERS: { 'Fn::Sub': '${EmbeddingsApi} ${EmbeddingsBedrockModelId} ${EmbeddingsLambdaDimensions} ${EmbeddingsLambdaArn} ${EmbeddingsSagemakerEndpoint}' },
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
