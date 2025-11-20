/** ************************************************************************************************
 *   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
 *   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const { BedrockClient, GetFoundationModelCommand, GetInferenceProfileCommand } = require('@aws-sdk/client-bedrock');
const customSdkConfig = require('./util/customSdkConfig');
const region = process.env.AWS_REGION || 'us-east-1';
const bedrock = new BedrockClient(customSdkConfig({ region }));

//map the foundation model names used in previous versions to their official IDs. Using for compatability during upgrade paths
const foundationModelMapping = {
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

module.exports = class ModelAccess extends require('./base') {
    async Create(params, reply) {
        try {
            const { EmbeddingsBedrockModelId, LLMBedrockModelId, BedrockKnowledgeBaseModelId } = params;
            const modelArnSet = new Set();

            if (EmbeddingsBedrockModelId) {
                const modelArns = await this.getModelArns(EmbeddingsBedrockModelId, 'EMBEDDING');
                modelArns.forEach((arn) => modelArnSet.add(arn));
            }

            if (LLMBedrockModelId) {
                const modelArns = await this.getModelArns(LLMBedrockModelId);
                modelArns.forEach((arn) => modelArnSet.add(arn));
            }

            if (BedrockKnowledgeBaseModelId) {
                const modelArns = await this.getModelArns(BedrockKnowledgeBaseModelId);
                modelArns.forEach((arn) => modelArnSet.add(arn));
            }

            reply(null, 'bedrock-access', { modelArn: Array.from(modelArnSet) });
        } catch (error) {
            console.error('Error in ModelAccess Create:', error);
            reply(error.message || 'Failed to process model IDs');
        }
    }

    Update(ID, params, oldparams, reply) {
        this.Create(params, reply);
    }

    Delete(ID, params, reply) {
        reply();
    }

    /**
     * Retrieves model ARNs for a given model ID, handling both foundation models and inference profiles.
     * @param {string} modelId - The Bedrock model ID or inference profile ID
     * @param {string} requiredOutputModality - Required output modality: 'TEXT' or 'EMBEDDING' (default: 'TEXT')
     * @returns {Promise<string[]>} Array of model ARNs (single ARN for foundation models, multiple for inference profiles)
     * @throws {Error} If model ID is missing or invalid
     */
    async getModelArns(modelId, requiredOutputModality = 'TEXT') {
        if (!modelId) {
            throw new Error('Model ID is required');
        }

        // Apply backward compatibility mapping if available
        modelId = foundationModelMapping[modelId] || modelId;

        if (this.isInferenceProfile(modelId)) {
            return await this.getInferenceProfileArns(modelId, requiredOutputModality);
        }

        //if not an inference profile, assuming on_demand
        return [await this.getFoundationModelArn(modelId, requiredOutputModality, 'ON_DEMAND')];
    }

    /**
     * Retrieves and validates the ARN for a Bedrock foundation model.
     * @param {string} modelId - The Bedrock foundation model ID
     * @param {string} requiredOutputModality - Required output modality: 'TEXT' or 'EMBEDDING'
     * @param {string} [requiredInferenceType] - Optional inference type requirement (e.g., 'ON_DEMAND')
     * @returns {Promise<string>} The model ARN
     * @throws {Error} If model doesn't meet requirements or validation fails
     */
    async getFoundationModelArn(modelId, requiredOutputModality, requiredInferenceType = undefined) {
        if (!modelId) {
            throw new Error('Model ID is required');
        }
        if (requiredOutputModality !== 'TEXT' && requiredOutputModality !== 'EMBEDDING') {
            throw new Error(
                `Unsupported output modality: ${requiredOutputModality}. Only TEXT and EMBEDDING are supported.`
            );
        }

        const command = new GetFoundationModelCommand({
            modelIdentifier: modelId
        });

        const response = await bedrock.send(command);
        if (!response) {
            throw new Error(`No response received for model ${modelId}`);
        }

        //model must support TEXT inputs
        if (!response.modelDetails?.inputModalities?.includes('TEXT')) {
            throw new Error(`Model ${modelId} does not support TEXT input modality`);
        }

        //model must support TEXT or EMBEDDING outputs (based on model type)
        if (!response.modelDetails?.outputModalities?.includes(requiredOutputModality)) {
            throw new Error(`Model ${modelId} does not support ${requiredOutputModality} output modality`);
        }

        //optionally enforce that a model must support required inference type
        if (requiredInferenceType && !response.modelDetails?.inferenceTypesSupported?.includes(requiredInferenceType)) {
            throw new Error(`Model ${modelId} does not support ${requiredInferenceType} inference type`);
        }

        if (!response.modelDetails?.modelArn) {
            throw new Error(`Model ${modelId} response missing modelArn`);
        }

        return response.modelDetails?.modelArn;
    }

    /**
     * Retrieves ARNs for an inference profile and its underlying foundation models.
     * For cross-region inference profiles, returns all model ARNs plus the profile ARN.
     * Validates that the home region foundation model supports the required output modality.
     * @param {string} inferenceProfileId - The Bedrock inference profile ID
     * @param {string} requiredOutputModality - Required output modality: 'TEXT' or 'EMBEDDING'
     * @returns {Promise<string[]>} Array of ARNs including all foundation models and the inference profile
     * @throws {Error} If profile is invalid or home region model doesn't support required modality
     */
    async getInferenceProfileArns(inferenceProfileId, requiredOutputModality) {
        const command = new GetInferenceProfileCommand({
            inferenceProfileIdentifier: inferenceProfileId
        });

        const response = await bedrock.send(command);

        if (!response.inferenceProfileArn) {
            throw new Error(`Inference profile ${inferenceProfileId} response missing inferenceProfileArn`);
        }
        if (!response.models || response.models.length === 0) {
            throw new Error(`Inference profile ${inferenceProfileId} contains no models`);
        }

        //IAM permissions created for cross region inference must allow all underlying foundation models, alongside the inference profile itself
        let modelArns = response.models.map((model) => model.modelArn);
        modelArns.push(response.inferenceProfileArn);

        //get the foundation model ARN that exists in the current region
        const homeRegionFoundationModelArn = modelArns.find(
            (arn) => arn.includes(`:foundation-model/`) && arn.includes(`:bedrock:${region}:`)
        );
        if (!homeRegionFoundationModelArn) {
            throw new Error(
                `No foundation model found in home region ${region} for inference profile ${inferenceProfileId}`
            );
        }

        //athough the model exists, let's use getFoundationModelArn to validate that the modalities match
        await this.getFoundationModelArn(homeRegionFoundationModelArn, requiredOutputModality);

        return modelArns;
    }

    /**
     * Determines if a model ID represents an inference profile based on its format.
     * Inference profiles have three dot-separated segments: <geo>.<provider>.<id> (e.g., 'us.amazon.nova-premier-v1:0').
     * @param {string} modelId - The model ID to check
     * @returns {boolean} True if the ID is an inference profile, false otherwise
     * @throws {Error} If modelId is not a non-empty string
     */
    isInferenceProfile(modelId) {
        if (!modelId || typeof modelId !== 'string') {
            throw new Error('Model ID must be a non-empty string');
        }
        return modelId.split('.').length === 3;
    }
};
