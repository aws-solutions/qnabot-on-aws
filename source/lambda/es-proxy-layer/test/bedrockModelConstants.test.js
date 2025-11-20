/** ************************************************************************************************
 *   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
 *   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { FOUNDATION_MODEL_MAPPING, applyModelIdMapping } = require('../lib/bedrock/bedrockModelConstants');

describe('bedrockModelConstants', () => {
    describe('FOUNDATION_MODEL_MAPPING', () => {
        test('contains expected model mappings', () => {
            expect(FOUNDATION_MODEL_MAPPING).toBeDefined();
            expect(typeof FOUNDATION_MODEL_MAPPING).toBe('object');
            expect(Object.keys(FOUNDATION_MODEL_MAPPING).length).toBeGreaterThan(0);
        });

        test('maps short model IDs to full model IDs', () => {
            expect(FOUNDATION_MODEL_MAPPING['amazon.titan-text-premier-v1']).toBe('amazon.titan-text-premier-v1:0');
            expect(FOUNDATION_MODEL_MAPPING['anthropic.claude-3-haiku-v1']).toBe('anthropic.claude-3-haiku-20240307-v1:0');
            expect(FOUNDATION_MODEL_MAPPING['meta.llama3-8b-instruct-v1']).toBe('meta.llama3-8b-instruct-v1:0');
        });
    });

    describe('applyModelIdMapping', () => {
        test('returns mapped model ID when mapping exists', () => {
            expect(applyModelIdMapping('amazon.titan-text-premier-v1')).toBe('amazon.titan-text-premier-v1:0');
            expect(applyModelIdMapping('anthropic.claude-3-haiku-v1')).toBe('anthropic.claude-3-haiku-20240307-v1:0');
            expect(applyModelIdMapping('anthropic.claude-3-sonnet-v1')).toBe('anthropic.claude-3-sonnet-20240229-v1:0');
            expect(applyModelIdMapping('anthropic.claude-3.5-haiku-v1')).toBe('anthropic.claude-3-5-haiku-20241022-v1:0');
            expect(applyModelIdMapping('anthropic.claude-3.5-sonnet-v1')).toBe('anthropic.claude-3-5-sonnet-20240620-v1:0');
            expect(applyModelIdMapping('anthropic.claude-3.5-sonnet-v2')).toBe('anthropic.claude-3-5-sonnet-20241022-v2:0');
        });

        test('returns original model ID when no mapping exists', () => {
            expect(applyModelIdMapping('amazon.titan-text-premier-v1:0')).toBe('amazon.titan-text-premier-v1:0');
            expect(applyModelIdMapping('some.unknown-model')).toBe('some.unknown-model');
            expect(applyModelIdMapping('us.anthropic.claude-3-haiku-20240307-v1:0')).toBe('us.anthropic.claude-3-haiku-20240307-v1:0');
            expect(applyModelIdMapping('arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0')).toBe('arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0');
        });
    });
});
