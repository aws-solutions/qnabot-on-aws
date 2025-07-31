/* eslint-disable max-len */
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const config = require('../../config.json');
const outputs = require('../../bin/exports');

module.exports = Promise.all([
    Promise.resolve(require('../master')),
    outputs('dev/bootstrap'),
]).then(([base, output]) => { // NOSONAR - javascript:S3776 - Ignoring this as an existing pattern to return base
    base.Parameters.BootstrapBucket.Default = output.Bucket;
    base.Parameters.BootstrapPrefix.Default = output.Prefix;
    base.Parameters.Email.Default = config.devEmail;
    base.Parameters.PublicOrPrivate.Default = config.devPublicOrPrivate ? config.devPublicOrPrivate : base.Parameters.PublicOrPrivate.Default;
    base.Parameters.Language.Default = config.devLanguage ? config.devLanguage : base.Parameters.Language.Default;
    base.Parameters.OpenSearchNodeCount.Default = config.devOpenSearchNodeCount ? config.devOpenSearchNodeCount : base.Parameters.OpenSearchNodeCount.Default;
    base.Parameters.OpenSearchDedicatedMasterNodes.Default = config.OpenSearchDedicatedMasterNodes ? config.OpenSearchDedicatedMasterNodes : base.Parameters.OpenSearchDedicatedMasterNodes.Default;
    base.Parameters.OpenSearchMasterNodeCount.Default = config.devOpenSearchMasterNodeCount ? config.devOpenSearchMasterNodeCount : base.Parameters.OpenSearchMasterNodeCount.Default;
    base.Parameters.KendraWebPageIndexId.Default = config.KendraWebPageIndexId ? config.KendraWebPageIndexId : base.Parameters.KendraWebPageIndexId.Default;
    base.Parameters.KendraFaqIndexId.Default = config.KendraFaqIndexId ? config.KendraFaqIndexId : base.Parameters.KendraFaqIndexId.Default;
    base.Parameters.AltSearchKendraIndexes.Default = config.AltSearchKendraIndexes ? config.AltSearchKendraIndexes : base.Parameters.AltSearchKendraIndexes.Default;
    base.Parameters.AltSearchKendraIndexAuth.Default = config.AltSearchKendraIndexAuth ? config.AltSearchKendraIndexAuth : base.Parameters.AltSearchKendraIndexAuth.Default;
    base.Parameters.Username.Default = config.Username ? config.Username : base.Parameters.Username.Default;
    base.Parameters.OpenSearchFineGrainAccessControl.Default = config.OpenSearchFineGrainAccessControl ? config.OpenSearchFineGrainAccessControl : base.Parameters.OpenSearchFineGrainAccessControl.Default;
    base.Parameters.XraySetting.Default = config.XraySetting ? config.XraySetting : base.Parameters.XraySetting.Default;
    base.Parameters.EmbeddingsLambdaArn.Default = config.EmbeddingsLambdaArn ? config.EmbeddingsLambdaArn : base.Parameters.EmbeddingsLambdaArn.Default;
    base.Parameters.LLMLambdaArn.Default = config.LLMLambdaArn ? config.LLMLambdaArn : base.Parameters.LLMLambdaArn.Default;
    base.Parameters.LogRetentionPeriod.Default = config.LogRetentionPeriod ? config.LogRetentionPeriod : base.Parameters.LogRetentionPeriod.Default;
    base.Parameters.ApprovedDomain.Default = config.ApprovedDomain ? config.ApprovedDomain : base.Parameters.ApprovedDomain.Default;
    base.Parameters.OpenSearchNodeInstanceType.Default = config.OpenSearchNodeInstanceType ? config.OpenSearchNodeInstanceType : base.Parameters.OpenSearchNodeInstanceType.Default;
    base.Parameters.OpenSearchMasterNodeInstanceType.Default = config.OpenSearchMasterNodeInstanceType ? config.OpenSearchMasterNodeInstanceType : base.Parameters.OpenSearchMasterNodeInstanceType.Default;
    base.Parameters.VPCSubnetIdList.Default = config.VPCSubnetIdList ? config.VPCSubnetIdList : base.Parameters.VPCSubnetIdList.Default;
    base.Parameters.VPCSecurityGroupIdList.Default = config.VPCSecurityGroupIdList ? config.VPCSecurityGroupIdList : base.Parameters.VPCSecurityGroupIdList.Default;
    base.Parameters.FulfillmentConcurrency.Default = config.FulfillmentConcurrency ? config.FulfillmentConcurrency : base.Parameters.FulfillmentConcurrency.Default;
    base.Parameters.LexV2BotLocaleIds.Default = config.LexV2BotLocaleIds ? config.LexV2BotLocaleIds : base.Parameters.LexV2BotLocaleIds.Default;
    base.Parameters.EmbeddingsApi.Default = config.EmbeddingsApi ? config.EmbeddingsApi : base.Parameters.EmbeddingsApi.Default;
    base.Parameters.EmbeddingsBedrockModelId.Default = config.EmbeddingsBedrockModelId ? config.EmbeddingsBedrockModelId : base.Parameters.EmbeddingsBedrockModelId.Default;
    base.Parameters.LLMApi.Default = config.LLMApi ? config.LLMApi : base.Parameters.LLMApi.Default;
    base.Parameters.LLMBedrockModelId.Default = config.LLMBedrockModelId ? config.LLMBedrockModelId : base.Parameters.LLMBedrockModelId.Default;
    base.Parameters.EnableStreaming.Default = config.EnableStreaming ? config.EnableStreaming : base.Parameters.EnableStreaming.Default;
    base.Parameters.BedrockKnowledgeBaseId.Default = config.BedrockKnowledgeBaseId ? config.BedrockKnowledgeBaseId : base.Parameters.BedrockKnowledgeBaseId.Default;
    base.Parameters.BedrockKnowledgeBaseModel.Default = config.BedrockKnowledgeBaseModel ? config.BedrockKnowledgeBaseModel : base.Parameters.BedrockKnowledgeBaseModel.Default;
    base.Parameters.InstallLexResponseBots.Default = config.InstallLexResponseBots ? config.InstallLexResponseBots : base.Parameters.InstallLexResponseBots.Default;
    return base;
});
