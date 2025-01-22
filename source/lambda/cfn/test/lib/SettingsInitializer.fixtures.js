/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.SettingsInitializerObject = function() {
    const params = {
        SettingsTable: { Ref: 'SettingsTable' },
        ES_USE_KEYWORD_FILTERS: true,
        EMBEDDINGS_ENABLE: false,
        EMBEDDINGS_MAX_TOKEN_LIMIT: 'Test',
        EMBEDDINGS_SCORE_THRESHOLD: .7,
        EMBEDDINGS_TEXT_PASSAGE_SCORE_THRESHOLD: .8,
        LLM_GENERATE_QUERY_ENABLE: false,
        LLM_API: 'Test',
        NATIVE_LANGUAGE: 'English',
        ALT_SEARCH_KENDRA_INDEXES: '',
        ALT_SEARCH_KENDRA_INDEX_AUTH: '',
        KENDRA_FAQ_INDEX: '',
        KENDRA_WEB_PAGE_INDEX: '',
        LLM_QA_ENABLE: false,
        LLM_GENERATE_QUERY_PROMPT_TEMPLATE: false,
        LLM_GENERATE_QUERY_SYSTEM_PROMPT: 'Test',
        LLM_QA_PROMPT_TEMPLATE: 'Test',
        LLM_QA_SYSTEM_PROMPT: 'Test',
        LLM_GENERATE_QUERY_MODEL_PARAMS: {},
        LLM_QA_MODEL_PARAMS: '{}',
        LLM_PROMPT_MAX_TOKEN_LIMIT: 'Test',
        LLM_QA_NO_HITS_REGEX: 'Test',
        KNOWLEDGE_BASE_PROMPT_TEMPLATE: '',
        LLM_STREAMING_ENABLED: false,
        STREAMING_TABLE: false,
        EMBEDDINGS_MODEL_ID: 'Test',
        LLM_MODEL_ID: 'Test',
        KNOWLEDGE_BASE_MODEL_ID: 'Test',
        KNOWLEDGE_BASE_ID: 'Test',
    }

    return params;
}
