/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.getInferenceProfileCommandResponse = function () {
    return {
        inferenceProfileArn: 'arn:aws:bedrock:us-east-1:123456789012:inference-profile/us.anthropic.claude-3-haiku-20240307-v1:0',
        models: [
            {
                modelArn: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0'
            },
            {
                modelArn: 'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-haiku-20240307-v1:0'
            }
        ],
    };
};

exports.getInferenceProfileCommandResponseGlobal = function () {
    return {
        inferenceProfileArn: 'arn:aws:bedrock:us-east-1:123456789012:inference-profile/global.anthropic.claude-3-haiku-20240307-v1:0',
        models: [
            {
                modelArn: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0'
            }
        ]
    };
};

exports.paramsWithEmbeddingsModel = function () {
    return {
        EmbeddingsBedrockModelId: 'amazon.titan-embed-text-v1'
    };
};

exports.paramsWithLLMModel = function () {
    return {
        LLMBedrockModelId: 'anthropic.claude-3-sonnet-20240229-v1:0'
    };
};

exports.paramsWithKnowledgeBaseModel = function () {
    return {
        BedrockKnowledgeBaseModelId: 'amazon.titan-embed-text-v2:0'
    };
};

exports.paramsWithInferenceProfile = function () {
    return {
        LLMBedrockModelId: 'us.anthropic.claude-3-haiku-20240307-v1:0'
    };
};

exports.paramsWithGlobalInferenceProfile = function () {
    return {
        LLMBedrockModelId: 'global.anthropic.claude-3-haiku-20240307-v1:0'
    };
};

exports.paramsWithAllModels = function () {
    return {
        EmbeddingsBedrockModelId: 'amazon.titan-embed-text-v1',
        LLMBedrockModelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        BedrockKnowledgeBaseModelId: 'us.anthropic.claude-3-haiku-20240307-v1:0'
    };
};

exports.paramsWithInvalidModel = function () {
    return {
        EmbeddingsBedrockModelId: 'invalid.model.format.too.many.parts'
    };
};

exports.emptyParams = function () {
    return {};
};

exports.paramsWithLegacyModelId = function () {
    return {
        LLMBedrockModelId: 'anthropic.claude-3-sonnet-v1' // Legacy format without full version
    };
};

exports.getFoundationModelCommandResponse = function (modelArn, inputModalities = ['TEXT'], outputModalities = ['TEXT'], inferenceTypesSupported = ['ON_DEMAND']) {
    return {
        modelDetails: {
            modelArn,
            inputModalities,
            outputModalities,
            inferenceTypesSupported
        }
    };
};

exports.getFoundationModelCommandResponseEmbedding = function (modelArn) {
    return {
        modelDetails: {
            modelArn,
            inputModalities: ['TEXT'],
            outputModalities: ['EMBEDDING'],
            inferenceTypesSupported: ['ON_DEMAND']
        }
    };
};

exports.paramsWithUnsupportedModality = function () {
    return {
        EmbeddingsBedrockModelId: 'anthropic.claude-3-sonnet-20240229-v1:0' // TEXT model used for EMBEDDING
    };
};

exports.getInferenceProfileCommandResponseMultiRegion = function () {
    return {
        inferenceProfileArn: 'arn:aws:bedrock:us-east-1:123456789012:inference-profile/us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        models: [
            {
                modelArn: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0'
            },
            {
                modelArn: 'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0'
            },
            {
                modelArn: 'arn:aws:bedrock:us-east-2::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0'
            }
        ]
    };
};

exports.getInferenceProfileCommandResponseNoHomeRegion = function () {
    return {
        inferenceProfileArn: 'arn:aws:bedrock:us-east-1:123456789012:inference-profile/us.anthropic.claude-3-haiku-20240307-v1:0',
        models: [
            {
                modelArn: 'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-haiku-20240307-v1:0'
            },
            {
                modelArn: 'arn:aws:bedrock:us-east-2::foundation-model/anthropic.claude-3-haiku-20240307-v1:0'
            }
        ]
    };
};