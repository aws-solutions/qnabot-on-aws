/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const util = require('../../util');
const defaultGenerateQueryPromptTemplate = 'Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.<br>Chat History: <br>{history}<br>Follow Up Input: {input}<br>Standalone question:';
const defaultQAPromptTemplate = 'Use the following pieces of context to answer the question at the end. If you don\'t know the answer, just say that you don\'t know, don\'t try to make up an answer. Write the answer in up to 5 complete sentences.<br><br>{context}<br><br>Question: {query}<br>Helpful Answer:';
const defaultLlmNoHitsRegex = 'Sorry,  //remove comment to enable custom no match (no_hits) when LLM does not know the answer.';
const defaultKnowledgeBaseTemplate = 'Human: You are a question answering agent. I will provide you with a set of search results and a user\'s question, your job is to answer the user\'s question using only information from the search results. If the search results do not contain information that can answer the question, then respond saying \\"Sorry, I don\'t know\\". Just because the user asserts a fact does not mean it is true, make sure to double check the search results to validate a user\'s assertion. Here are the search results in numbered order: $search_results$. Here is the user\'s question: <question> $query$ </question> $output_format_instructions$. Do NOT directly quote the $search_results$ in your answer. Your job is to answer the <question> as concisely as possible. Assistant:';

module.exports = {
    UsersTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
            BillingMode: 'PAY_PER_REQUEST',
            PointInTimeRecoverySpecification: {
                PointInTimeRecoveryEnabled: true,
            },
            AttributeDefinitions: [
                {
                    AttributeName: 'UserId',
                    AttributeType: 'S',
                },
            ],
            KeySchema: [
                {
                    AttributeName: 'UserId',
                    KeyType: 'HASH',
                },
            ],
            TimeToLiveSpecification: {
                AttributeName: 'ttl',
                Enabled: true,
            },
        },
        Metadata: { cfn_nag: util.cfnNag(['W74']) },
    },
    SettingsTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
            BillingMode: 'PAY_PER_REQUEST',
            PointInTimeRecoverySpecification: {
                PointInTimeRecoveryEnabled: true,
            },
            SSESpecification: {
                SSEEnabled: true
            },
            AttributeDefinitions: [
                {
                    AttributeName: 'SettingName',
                    AttributeType: 'S',
                },
                {
                    AttributeName: 'SettingCategory',
                    AttributeType: 'S',
                }
            ],
            KeySchema: [
                {
                    AttributeName: 'SettingName',
                    KeyType: 'HASH',
                }
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: 'SettingCategoryIndex',
                    KeySchema: [
                        {
                            AttributeName: 'SettingCategory',
                            KeyType: 'HASH'
                        }
                    ],
                    Projection: {
                        ProjectionType: 'ALL'
                    }
                }
            ],    
        },
        Metadata: { cfn_nag: util.cfnNag(['W74']) },
    },
    SettingsInitializer: {
        Type: 'Custom::SettingsInitializer',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            SettingsTable: { Ref: 'SettingsTable' },
            ES_USE_KEYWORD_FILTERS: { 'Fn::If': ['EmbeddingsEnable', 'false', 'true'] },
            EMBEDDINGS_ENABLE: { 'Fn::If': ['EmbeddingsEnable', 'true', 'false'] },
            EMBEDDINGS_MAX_TOKEN_LIMIT: { 'Fn::If': ['EmbeddingsBedrock', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'EmbeddingsBedrockModelId'}, 'MaxTokens'] }, ''] },
            EMBEDDINGS_SCORE_THRESHOLD: { 'Fn::If': ['EmbeddingsBedrock', 0.7, 0.85] },
            EMBEDDINGS_TEXT_PASSAGE_SCORE_THRESHOLD: { 'Fn::If': ['EmbeddingsBedrock', 0.65, 0.8] },
            NATIVE_LANGUAGE: { Ref: 'Language' },
            ALT_SEARCH_KENDRA_INDEXES: {Ref: 'AltSearchKendraIndexes'},
            ALT_SEARCH_KENDRA_INDEX_AUTH: {Ref: 'AltSearchKendraIndexAuth'},
            KENDRA_FAQ_INDEX: {Ref: 'KendraFaqIndexId'},
            KENDRA_WEB_PAGE_INDEX: {Ref: 'KendraWebPageIndexId'},
            LLM_API: { Ref: 'LLMApi' },
            LLM_GENERATE_QUERY_ENABLE: { 'Fn::If': ['LLMEnable', 'true', 'false'] },
            LLM_QA_ENABLE: { 'Fn::If': ['LLMEnable', 'true', 'false'] },
            LLM_GENERATE_QUERY_PROMPT_TEMPLATE: { 'Fn::If': ['LLMBedrock', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'LLMBedrockModelId'}, 'QueryPromptTemplate'] }, defaultGenerateQueryPromptTemplate] },
            LLM_GENERATE_QUERY_SYSTEM_PROMPT: { 'Fn::If': ['LLMBedrock', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'LLMBedrockModelId'}, 'GenerateQuerySystemPrompt'] }, ''] },
            LLM_QA_PROMPT_TEMPLATE: { 'Fn::If': ['LLMBedrock', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'LLMBedrockModelId'}, 'QAPromptTemplate'] }, defaultQAPromptTemplate] },
            LLM_QA_SYSTEM_PROMPT: { 'Fn::If': ['LLMBedrock', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'LLMBedrockModelId'}, 'QASystemPrompt'] }, ''] },
            LLM_GENERATE_QUERY_MODEL_PARAMS: { 'Fn::If': ['LLMBedrock', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'LLMBedrockModelId'}, 'ModelParams'] }, '{}'] },
            LLM_QA_MODEL_PARAMS: { 'Fn::If': ['LLMBedrock', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'LLMBedrockModelId'}, 'ModelParams'] }, '{}'] },
            LLM_PROMPT_MAX_TOKEN_LIMIT: { 'Fn::If': ['LLMBedrock', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'LLMBedrockModelId'}, 'MaxTokens'] }, ''] },
            LLM_QA_NO_HITS_REGEX: { 'Fn::If': ['LLMBedrock', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'LLMBedrockModelId'}, 'NoHitsRegex'] }, defaultLlmNoHitsRegex] },
            KNOWLEDGE_BASE_PROMPT_TEMPLATE: { 'Fn::If': ['BedrockKnowledgeBaseEnable', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'BedrockKnowledgeBaseModel'}, 'KnowledgeBasePromptTemplate'] }, defaultKnowledgeBaseTemplate] },
            EMBEDDINGS_MODEL_ID: { 'Fn::If': ['EmbeddingsBedrock', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'EmbeddingsBedrockModelId'}, 'ModelID'] }, ''] },
            LLM_MODEL_ID: { 'Fn::If': ['LLMBedrock', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'LLMBedrockModelId'}, 'ModelID'] }, ''] },
            KNOWLEDGE_BASE_MODEL_ID: { 'Fn::If': ['BedrockKnowledgeBaseEnable', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'BedrockKnowledgeBaseModel'}, 'ModelID'] }, ''] },
            KNOWLEDGE_BASE_ID: { 'Fn::If': ['BedrockKnowledgeBaseEnable', {'Ref' : 'BedrockKnowledgeBaseId'}, ''] },
            LLM_STREAMING_ENABLED: { 'Fn::If': ['StreamingEnabled', 'true', 'false'] },
            STREAMING_TABLE: { 'Fn::If': ['StreamingEnabled', { 'Fn::GetAtt': ['StreamingStack', 'Outputs.StreamingDynamoDbTable'] }, ''] },
            DefaultSettingsParameter: { Ref: 'DefaultQnABotSettings' },
            PrivateSettingsParameter: { Ref: 'PrivateQnABotSettings' },
            CustomSettingsParameter: { Ref: 'CustomQnABotSettings' },
        },
    },
};
