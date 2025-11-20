/** ************************************************************************************************
 *   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
 *   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

/**
 * Maps foundation model names used in previous versions to their official IDs.
 * Used for backward compatibility during upgrade paths.
 */
const FOUNDATION_MODEL_MAPPING = {
    'ai21.jamba-instruct-v1': 'ai21.jamba-instruct-v1:0',
    'amazon.nova-lite-v1': 'amazon.nova-lite-v1:0',
    'amazon.nova-micro-v1': 'amazon.nova-micro-v1:0',
    'amazon.nova-pro-v1': 'amazon.nova-pro-v1:0',
    'amazon.titan-text-express-v1': 'amazon.titan-text-express-v1',
    'amazon.titan-text-lite-v1': 'amazon.titan-text-lite-v1',
    'amazon.titan-text-premier-v1': 'amazon.titan-text-premier-v1:0',
    'anthropic.claude-3-haiku-v1': 'anthropic.claude-3-haiku-20240307-v1:0',
    'anthropic.claude-3-sonnet-v1': 'anthropic.claude-3-sonnet-20240229-v1:0',
    'anthropic.claude-3.5-haiku-v1': 'anthropic.claude-3-5-haiku-20241022-v1:0',
    'anthropic.claude-3.5-sonnet-v1': 'anthropic.claude-3-5-sonnet-20240620-v1:0',
    'anthropic.claude-3.5-sonnet-v2': 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    'anthropic.claude-instant-v1': 'anthropic.claude-instant-v1',
    'anthropic.claude-v2.1': 'anthropic.claude-v2:1',
    'cohere.command-r-plus-v1': 'cohere.command-r-plus-v1:0',
    'meta.llama3-8b-instruct-v1': 'meta.llama3-8b-instruct-v1:0',
    'meta.llama3.1-405b-instruct-v1': 'meta.llama3-1-405b-instruct-v1:0',
    'mistral.mistral-large-2407-v1': 'mistral.mistral-large-2407-v1:0'
};

/**
 * Applies backward compatibility mapping to a model ID if available.
 * @param {string} modelId - The model ID to map
 * @returns {string} The mapped model ID or the original if no mapping exists
 */
function applyModelIdMapping(modelId) {
    return FOUNDATION_MODEL_MAPPING[modelId] || modelId;
}

module.exports = {
    FOUNDATION_MODEL_MAPPING,
    applyModelIdMapping
};
