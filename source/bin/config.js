/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = {
    region: 'us-east-1',
    profile: 'default',
    publicBucket: 'aws-bigdata-blog',
    publicPrefix: 'artifacts/aws-ai-qna-bot',
    devEmail: '',
    ApprovedDomain: 'NONE',
    Username: 'Admin',
    devPublicOrPrivate: 'PRIVATE',
    devLanguage: 'English',
    namespace: 'dev',
    LexV2BotLocaleIds: 'en_US,es_US,fr_CA',
    stackNamePrefix: 'QNA',
    skipCheckTemplate: false,
    noStackOutput: false,
    multiBucketDeployment: false,
    buildType: 'Custom',
    FulfillmentConcurrency: 1,
    EmbeddingsApi: 'BEDROCK',
    EmbeddingsBedrockModelId: 'amazon.titan-embed-text-v1',
    LLMApi: 'BEDROCK',
    LLMBedrockModelId: 'anthropic.claude-instant-v1',
    LogRetentionPeriod: 0,
    BedrockKnowledgeBaseId: '',
    BedrockKnowledgeBaseModel: 'anthropic.claude-instant-v1',
    InstallLexResponseBots: true,
    KendraWebPageIndexId: '',
    KendraFaqIndexId: '',
    AltSearchKendraIndexes: '',
    AltSearchKendraIndexAuth: 'false',
    XraySetting: 'FALSE',
    EmbeddingsLambdaArn: '',
    LLMSagemakerInstanceType: 'ml.g5.12xlarge',
    LLMLambdaArn: '',
    devOpenSearchNodeCount: 1,
    OpenSearchInstanceType: 'm6g.large.search',
    OpenSearchFineGrainAccessControl: 'TRUE',
    VPCSubnetIdList: '',
    VPCSecurityGroupIdList: '',
};

if (require.main === module) {
    if (process.argv.includes('buildType=AWSSolutions')) {
        module.exports.buildType = 'AWSSolutions';
        module.exports.publicBucket = '%%BUCKET_NAME%%';
        module.exports.publicPrefix = '%%SOLUTION_NAME%%/%%VERSION%%';
        module.exports.skipCheckTemplate = true;
        module.exports.noStackOutput = true;
    } else {
        module.exports.devEmail = process.argv[2] || 'user@example.com';
        module.exports.region = process.argv[3] || 'us-east-1';
    }
    console.log(JSON.stringify(module.exports, null, 2));
}
