/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = {
    Parameters: {
        BootstrapBucket: {
            Default: 'test',
        },
        BootstrapPrefix: {
            Default: 'test',
        },
        Email: {
            Default: 'test',
        },
        PublicOrPrivate: {
            Default: 'test',
        },
        Language: {
            Default: 'test',
        },
        OpenSearchNodeCount: {
            Default: 'test',
        },
        KendraWebPageIndexId: {
            Default: 'test',
        },
        KendraFaqIndexId: {
            Default: 'test',
        },
        AltSearchKendraIndexes: {
            Default: 'test',
        },
        AltSearchKendraIndexAuth: {
            Default: 'test',
        },
        FulfillmentConcurrency: {
            Default: 'test',
        },
        LexV2BotLocaleIds: {
            Default: 'test',
        },
        EmbeddingsApi: {
            Default: 'test',
        },
        EmbeddingsBedrockModelId: {
            Default: 'test',
        },
        LLMApi: {
            Default: 'test',
        },
        LLMBedrockModelId: {
            Default: 'test',
        },
        BedrockKnowledgeBaseId: {
            Default: 'test',
        },
        BedrockKnowledgeBaseModel: {
            Default: 'anthropic.claude-instant-v1',
        },
        InstallLexResponseBots: {
            Default: 'test',
        },
        Username: {
            Default: 'test',
        },
        ApprovedDomain: {
            Default: 'test',
        },
        XraySetting: {
            Default: 'test',
        },
        EmbeddingsLambdaArn: {
            Default: '0000000000000000000000000000000000000:function:test',
        },
        LLMLambdaArn: {
            Default: '0000000000000000000000000000000000000:function:test',
        },
        LogRetentionPeriod: {
            Default: 0
        },
        VPCSubnetIdList: {
            Default: 'test',
        },
        VPCSecurityGroupIdList: {
            Default: 'sg-0000000000000000,sg-0000000000000000',
        },
        OpenSearchNodeInstanceType: {
            Default: 'test',
        },
        OpenSearchFineGrainAccessControl: {
            Default: 'FALSE',
        },
        OpenSearchDedicatedMasterNodes: {
            Default: 'DISABLED',
        },
        OpenSearchMasterNodeInstanceType: {
            Default: 'test',
        },
        OpenSearchMasterNodeCount: {
            Default: 'test',
        },
        EnableStreaming: {
            Default: 'FALSE',
        }
    },
};
