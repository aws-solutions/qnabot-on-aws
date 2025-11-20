/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { mockClient } = require('aws-sdk-client-mock');
const { BedrockClient, GetInferenceProfileCommand, GetFoundationModelCommand } = require('@aws-sdk/client-bedrock');
const originalEnv = process.env;

// Set AWS_REGION before loading ModelAccess module
process.env.AWS_REGION = 'us-east-1';

const ModelAccess = require('../../lib/ModelAccess');
const modelAccessFixtures = require('./ModelAccess.fixtures');
const bedrockClientMock = mockClient(BedrockClient);

describe('test ModelAccess class', () => {
    beforeEach(() => {
        bedrockClientMock.reset();
    });

    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    it('should be able to create ModelAccess with foundation model on Create', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithEmbeddingsModel();
        const foundationModelResponse = modelAccessFixtures.getFoundationModelCommandResponseEmbedding(
            'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1'
        );
        
        const callback = (error, result, data) => {
            expect(error).toBeNull();
            expect(result).toBe('bedrock-access');
            expect(data.modelArn).toEqual(['arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1']);
        };

        bedrockClientMock.on(GetFoundationModelCommand).resolves(foundationModelResponse);

        await modelAccessCut.Create(params, callback);
    });

    it('should be able to create ModelAccess with LLM model on Create', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithLLMModel();
        const foundationModelResponse = modelAccessFixtures.getFoundationModelCommandResponse(
            'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0'
        );
        
        const callback = (error, result, data) => {
            expect(error).toBeNull();
            expect(result).toBe('bedrock-access');
            expect(data.modelArn).toEqual(['arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0']);
        };

        bedrockClientMock.on(GetFoundationModelCommand).resolves(foundationModelResponse);

        await modelAccessCut.Create(params, callback);
    });

    it('should be able to create ModelAccess with knowledge base model on Create', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithKnowledgeBaseModel();
        const foundationModelResponse = modelAccessFixtures.getFoundationModelCommandResponse(
            'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0'
        );
        
        const callback = (error, result, data) => {
            expect(error).toBeNull();
            expect(result).toBe('bedrock-access');
            expect(data.modelArn).toEqual(['arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0']);
        };

        bedrockClientMock.on(GetFoundationModelCommand).resolves(foundationModelResponse);

        await modelAccessCut.Create(params, callback);
    });

    it('should be able to create ModelAccess with cross-region inference profile on Create', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithInferenceProfile();
        const inferenceProfileResponse = modelAccessFixtures.getInferenceProfileCommandResponse();
        const foundationModelResponse = modelAccessFixtures.getFoundationModelCommandResponse(
            'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0'
        );
        
        const callback = (error, result, data) => {
            expect(error).toBeNull();
            expect(result).toBe('bedrock-access');
            expect(data.modelArn).toEqual([
                'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
                'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
                'arn:aws:bedrock:us-east-1:123456789012:inference-profile/us.anthropic.claude-3-haiku-20240307-v1:0'
            ]);
        };

        bedrockClientMock.on(GetInferenceProfileCommand).resolves(inferenceProfileResponse);
        bedrockClientMock.on(GetFoundationModelCommand).resolves(foundationModelResponse);

        await modelAccessCut.Create(params, callback);
    });

    it('should be able to create ModelAccess with global inference profile on Create', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithGlobalInferenceProfile();
        const inferenceProfileResponse = modelAccessFixtures.getInferenceProfileCommandResponseGlobal();
        const foundationModelResponse = modelAccessFixtures.getFoundationModelCommandResponse(
            'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0'
        );
        
        const callback = (error, result, data) => {
            expect(error).toBeNull();
            expect(result).toBe('bedrock-access');
            expect(data.modelArn).toEqual([
                'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
                'arn:aws:bedrock:us-east-1:123456789012:inference-profile/global.anthropic.claude-3-haiku-20240307-v1:0'
            ]);
        };

        bedrockClientMock.on(GetInferenceProfileCommand).resolves(inferenceProfileResponse);
        bedrockClientMock.on(GetFoundationModelCommand).resolves(foundationModelResponse);

        await modelAccessCut.Create(params, callback);
    });

    it('should be able to create ModelAccess with all model types on Create', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithAllModels();
        const inferenceProfileResponse = modelAccessFixtures.getInferenceProfileCommandResponse();
        
        const callback = (error, result, data) => {
            expect(error).toBeNull();
            expect(result).toBe('bedrock-access');
            expect(data.modelArn).toEqual([
                'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1',
                'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0',
                'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
                'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
                'arn:aws:bedrock:us-east-1:123456789012:inference-profile/us.anthropic.claude-3-haiku-20240307-v1:0'
            ]);
        };

        bedrockClientMock.on(GetInferenceProfileCommand).resolves(inferenceProfileResponse);
        bedrockClientMock.on(GetFoundationModelCommand, {
            modelIdentifier: 'amazon.titan-embed-text-v1'
        }).resolves(modelAccessFixtures.getFoundationModelCommandResponseEmbedding(
            'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1'
        ));
        bedrockClientMock.on(GetFoundationModelCommand, {
            modelIdentifier: 'anthropic.claude-3-sonnet-20240229-v1:0'
        }).resolves(modelAccessFixtures.getFoundationModelCommandResponse(
            'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0'
        ));
        bedrockClientMock.on(GetFoundationModelCommand, {
            modelIdentifier: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0'
        }).resolves(modelAccessFixtures.getFoundationModelCommandResponse(
            'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0'
        ));
        bedrockClientMock.on(GetFoundationModelCommand, {
            modelIdentifier: 'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-haiku-20240307-v1:0'
        }).resolves(modelAccessFixtures.getFoundationModelCommandResponse(
            'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-haiku-20240307-v1:0'
        ));

        await modelAccessCut.Create(params, callback);
    });

    it('should handle empty parameters on Create', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.emptyParams();
        
        const callback = (error, result, data) => {
            expect(error).toBeNull();
            expect(result).toBe('bedrock-access');
            expect(data.modelArn).toEqual([]);
        };

        await modelAccessCut.Create(params, callback);
    });

    it('should return error if GetFoundationModelCommand fails on Create', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithInvalidModel();
        
        const callback = (error, result) => {
            expect(error).toContain('mocked_error');
            expect(result).toBeUndefined();
        };

        bedrockClientMock.on(GetFoundationModelCommand).rejects(new Error('mocked_error'));

        await modelAccessCut.Create(params, callback);
    });

    it('should return error if GetInferenceProfileCommand fails on Create', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithInferenceProfile();
        
        const callback = (error, result) => {
            expect(error).toContain('mocked_error');
            expect(result).toBeUndefined();
        };

        bedrockClientMock.on(GetInferenceProfileCommand).rejects(new Error('mocked_error'));

        await modelAccessCut.Create(params, callback);
    });

    it('should call Create when Update is called', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithEmbeddingsModel();
        const createSpy = jest.spyOn(ModelAccess.prototype, 'Create');
        
        const callback = (error, result) => {};

        await modelAccessCut.Update('mock_id', params, {}, callback);

        expect(createSpy).toHaveBeenCalledWith(params, callback);
    });

    it('should do nothing when Delete is called', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithEmbeddingsModel();
        
        const callback = jest.fn();

        await modelAccessCut.Delete('mock_id', params, callback);

        expect(callback).toHaveBeenCalledWith();
    });

    it('should handle inference profile without models array', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithInferenceProfile();
        const inferenceProfileResponse = {
            inferenceProfileArn: 'arn:aws:bedrock:us-east-1:123456789012:inference-profile/us.anthropic.claude-3-haiku-20240307-v1:0'
            // No models array
        };
        
        const callback = (error, result, data) => {
            expect(error).toBeNull();
            expect(result).toBe('bedrock-access');
            expect(data.modelArn).toEqual([
                'arn:aws:bedrock:us-east-1:123456789012:inference-profile/us.anthropic.claude-3-haiku-20240307-v1:0'
            ]);
        };

        bedrockClientMock.on(GetInferenceProfileCommand).resolves(inferenceProfileResponse);

        await modelAccessCut.Create(params, callback);
    });

    it('should not add duplicate ARNs to array', async () => {
        const modelAccessCut = new ModelAccess();
        const params = {
            EmbeddingsBedrockModelId: 'amazon.titan-embed-text-v1',
            LLMBedrockModelId: 'amazon.titan-embed-text-v1' // Same model ID
        };
        const foundationModelResponse = modelAccessFixtures.getFoundationModelCommandResponseEmbedding(
            'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1'
        );
        
        const callback = (error, result, data) => {
            expect(error).toBeNull();
            expect(result).toBe('bedrock-access');
            expect(data.modelArn).toEqual(['arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1']);
            expect(data.modelArn.length).toBe(1); // Should not have duplicates
        };

        bedrockClientMock.on(GetFoundationModelCommand).resolves(foundationModelResponse);

        await modelAccessCut.Create(params, callback);
    });

    it('should apply backward compatibility mapping for legacy model IDs', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithLegacyModelId();
        const foundationModelResponse = modelAccessFixtures.getFoundationModelCommandResponse(
            'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0'
        );
        
        const callback = (error, result, data) => {
            expect(error).toBeNull();
            expect(result).toBe('bedrock-access');
            expect(data.modelArn).toEqual(['arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0']);
        };

        bedrockClientMock.on(GetFoundationModelCommand).resolves(foundationModelResponse);

        await modelAccessCut.Create(params, callback);
    });

    it('should handle inference profile with multiple regions', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithInferenceProfile();
        const inferenceProfileResponse = modelAccessFixtures.getInferenceProfileCommandResponseMultiRegion();
        const foundationModelResponse = modelAccessFixtures.getFoundationModelCommandResponse(
            'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0'
        );
        
        const callback = (error, result, data) => {
            expect(error).toBeNull();
            expect(result).toBe('bedrock-access');
            expect(data.modelArn).toContain('arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0');
            expect(data.modelArn).toContain('arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0');
            expect(data.modelArn).toContain('arn:aws:bedrock:eu-west-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0');
            expect(data.modelArn).toContain('arn:aws:bedrock:us-east-1:123456789012:inference-profile/us.anthropic.claude-3-5-sonnet-20241022-v2:0');
        };

        bedrockClientMock.on(GetInferenceProfileCommand).resolves(inferenceProfileResponse);
        bedrockClientMock.on(GetFoundationModelCommand).resolves(foundationModelResponse);

        await modelAccessCut.Create(params, callback);
    });

    it('should throw error when inference profile has no home region model', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithInferenceProfile();
        const inferenceProfileResponse = modelAccessFixtures.getInferenceProfileCommandResponseNoHomeRegion();
        
        const callback = (error, result) => {
            expect(error).toContain('No foundation model found in home region us-east-1');
            expect(result).toBeUndefined();
        };

        bedrockClientMock.on(GetInferenceProfileCommand).resolves(inferenceProfileResponse);

        await modelAccessCut.Create(params, callback);
    });

    it('should throw error when model does not support required output modality', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithUnsupportedModality();
        const foundationModelResponse = modelAccessFixtures.getFoundationModelCommandResponse(
            'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0',
            ['TEXT'],
            ['TEXT'], // Only TEXT output, not EMBEDDING
            ['ON_DEMAND']
        );
        
        const callback = (error, result) => {
            expect(error).toContain('does not support EMBEDDING output modality');
            expect(result).toBeUndefined();
        };

        bedrockClientMock.on(GetFoundationModelCommand).resolves(foundationModelResponse);

        await modelAccessCut.Create(params, callback);
    });

    it('should validate isInferenceProfile correctly identifies inference profiles', () => {
        const modelAccessCut = new ModelAccess();
        
        expect(modelAccessCut.isInferenceProfile('us.anthropic.claude-3-haiku-20240307-v1:0')).toBe(true);
        expect(modelAccessCut.isInferenceProfile('global.amazon.nova-pro-v1:0')).toBe(true);
        expect(modelAccessCut.isInferenceProfile('anthropic.claude-3-sonnet-20240229-v1:0')).toBe(false);
        expect(modelAccessCut.isInferenceProfile('amazon.titan-embed-text-v1')).toBe(false);
    });

    it('should throw error for invalid model ID in isInferenceProfile', () => {
        const modelAccessCut = new ModelAccess();
        
        expect(() => modelAccessCut.isInferenceProfile('')).toThrow('Model ID must be a non-empty string');
        expect(() => modelAccessCut.isInferenceProfile(null)).toThrow('Model ID must be a non-empty string');
        expect(() => modelAccessCut.isInferenceProfile(123)).toThrow('Model ID must be a non-empty string');
    });

    it('should throw error when GetFoundationModelCommand returns no response', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithLLMModel();
        
        const callback = (error, result) => {
            expect(error).toContain('No response received for model');
            expect(result).toBeUndefined();
        };

        bedrockClientMock.on(GetFoundationModelCommand).resolves(null);

        await modelAccessCut.Create(params, callback);
    });

    it('should throw error when model does not support TEXT input modality', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithLLMModel();
        const foundationModelResponse = modelAccessFixtures.getFoundationModelCommandResponse(
            'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0',
            ['IMAGE'], // No TEXT input
            ['TEXT'],
            ['ON_DEMAND']
        );
        
        const callback = (error, result) => {
            expect(error).toContain('does not support TEXT input modality');
            expect(result).toBeUndefined();
        };

        bedrockClientMock.on(GetFoundationModelCommand).resolves(foundationModelResponse);

        await modelAccessCut.Create(params, callback);
    });

    it('should throw error when model does not support required inference type', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithLLMModel();
        const foundationModelResponse = modelAccessFixtures.getFoundationModelCommandResponse(
            'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0',
            ['TEXT'],
            ['TEXT'],
            ['PROVISIONED'] // Only PROVISIONED, not ON_DEMAND
        );
        
        const callback = (error, result) => {
            expect(error).toContain('does not support ON_DEMAND inference type');
            expect(result).toBeUndefined();
        };

        bedrockClientMock.on(GetFoundationModelCommand).resolves(foundationModelResponse);

        await modelAccessCut.Create(params, callback);
    });

    it('should throw error when model response is missing modelArn', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithLLMModel();
        const foundationModelResponse = {
            inputModalities: ['TEXT'],
            outputModalities: ['TEXT'],
            inferenceTypesSupported: ['ON_DEMAND']
            // Missing modelArn
        };
        
        const callback = (error, result) => {
            expect(error).toContain('response missing modelArn');
            expect(result).toBeUndefined();
        };

        bedrockClientMock.on(GetFoundationModelCommand).resolves(foundationModelResponse);

        await modelAccessCut.Create(params, callback);
    });

    it('should throw error when inference profile response is missing inferenceProfileArn', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithInferenceProfile();
        const inferenceProfileResponse = {
            models: [
                {
                    modelArn: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0'
                }
            ]
            // Missing inferenceProfileArn
        };
        
        const callback = (error, result) => {
            expect(error).toContain('response missing inferenceProfileArn');
            expect(result).toBeUndefined();
        };

        bedrockClientMock.on(GetInferenceProfileCommand).resolves(inferenceProfileResponse);

        await modelAccessCut.Create(params, callback);
    });

    it('should throw error when inference profile contains no models', async () => {
        const modelAccessCut = new ModelAccess();
        const params = modelAccessFixtures.paramsWithInferenceProfile();
        const inferenceProfileResponse = {
            inferenceProfileArn: 'arn:aws:bedrock:us-east-1:123456789012:inference-profile/us.anthropic.claude-3-haiku-20240307-v1:0',
            models: []
        };
        
        const callback = (error, result) => {
            expect(error).toContain('contains no models');
            expect(result).toBeUndefined();
        };

        bedrockClientMock.on(GetInferenceProfileCommand).resolves(inferenceProfileResponse);

        await modelAccessCut.Create(params, callback);
    });
});