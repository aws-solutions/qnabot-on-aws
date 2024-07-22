/* eslint-disable max-len */
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
    base.Parameters.KendraWebPageIndexId.Default = config.KendraWebPageIndexId ? config.KendraWebPageIndexId : base.Parameters.KendraWebPageIndexId.Default;
    base.Parameters.KendraFaqIndexId.Default = config.KendraFaqIndexId ? config.KendraFaqIndexId : base.Parameters.KendraFaqIndexId.Default;
    base.Parameters.AltSearchKendraIndexes.Default = config.AltSearchKendraIndexes ? config.AltSearchKendraIndexes : base.Parameters.AltSearchKendraIndexes.Default;
    base.Parameters.AltSearchKendraIndexAuth.Default = config.AltSearchKendraIndexAuth ? config.AltSearchKendraIndexAuth : base.Parameters.AltSearchKendraIndexAuth.Default;
    base.Parameters.Username.Default = config.Username ? config.Username : base.Parameters.Username.Default;
    base.Parameters.OpenSearchFineGrainAccessControl.Default = config.OpenSearchFineGrainAccessControl ? config.OpenSearchFineGrainAccessControl : base.Parameters.OpenSearchFineGrainAccessControl.Default;
    base.Parameters.XraySetting.Default = config.XraySetting ? config.XraySetting : base.Parameters.XraySetting.Default;
    base.Parameters.EmbeddingsLambdaArn.Default = config.EmbeddingsLambdaArn ? config.EmbeddingsLambdaArn : base.Parameters.EmbeddingsLambdaArn.Default;
    base.Parameters.LLMSagemakerInstanceType.Default = config.LLMSagemakerInstanceType ? config.LLMSagemakerInstanceType : base.Parameters.LLMSagemakerInstanceType.Default;
    base.Parameters.LLMLambdaArn.Default = config.LLMLambdaArn ? config.LLMLambdaArn : base.Parameters.LLMLambdaArn.Default;
    base.Parameters.ApprovedDomain.Default = config.ApprovedDomain ? config.ApprovedDomain : base.Parameters.ApprovedDomain.Default;
    base.Parameters.OpenSearchInstanceType.Default = config.OpenSearchInstanceType ? config.OpenSearchInstanceType : base.Parameters.OpenSearchInstanceType.Default;
    base.Parameters.VPCSubnetIdList.Default = config.VPCSubnetIdList ? config.VPCSubnetIdList : base.Parameters.VPCSubnetIdList.Default;
    base.Parameters.VPCSecurityGroupIdList.Default = config.VPCSecurityGroupIdList ? config.VPCSecurityGroupIdList : base.Parameters.VPCSecurityGroupIdList.Default;
    base.Parameters.LexBotVersion.Default = config.LexBotVersion ? config.LexBotVersion : base.Parameters.LexBotVersion.Default;
    base.Parameters.FulfillmentConcurrency.Default = config.FulfillmentConcurrency ? config.FulfillmentConcurrency : base.Parameters.FulfillmentConcurrency.Default;
    base.Parameters.LexV2BotLocaleIds.Default = config.LexV2BotLocaleIds ? config.LexV2BotLocaleIds : base.Parameters.LexV2BotLocaleIds.Default;
    base.Parameters.EmbeddingsApi.Default = config.EmbeddingsApi ? config.EmbeddingsApi : base.Parameters.EmbeddingsApi.Default;
    base.Parameters.EmbeddingsBedrockModelId.Default = config.EmbeddingsBedrockModelId ? config.EmbeddingsBedrockModelId : base.Parameters.EmbeddingsBedrockModelId.Default;
    base.Parameters.LLMApi.Default = config.LLMApi ? config.LLMApi : base.Parameters.LLMApi.Default;
    base.Parameters.LLMBedrockModelId.Default = config.LLMBedrockModelId ? config.LLMBedrockModelId : base.Parameters.LLMBedrockModelId.Default;
    base.Parameters.BedrockKnowledgeBaseId.Default = config.BedrockKnowledgeBaseId ? config.BedrockKnowledgeBaseId : base.Parameters.BedrockKnowledgeBaseId.Default;
    base.Parameters.BedrockKnowledgeBaseModel.Default = config.BedrockKnowledgeBaseModel ? config.BedrockKnowledgeBaseModel : base.Parameters.BedrockKnowledgeBaseModel.Default;
    base.Parameters.InstallLexResponseBots.Default = config.InstallLexResponseBots ? config.InstallLexResponseBots : base.Parameters.InstallLexResponseBots.Default;
    return base;
});
