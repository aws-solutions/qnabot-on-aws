/** ************************************************************************************************
 *   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
 *   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

jest.mock('qnabot/logging');

const { BedrockLlm } = require('../lib/bedrock/bedrockLLMProvider');

describe('BedrockLlm', () => {
    let llm;

    beforeEach(() => {
        llm = new BedrockLlm();
    });

    describe('constructor defaults', () => {
        test('sets expected defaults', () => {
            expect(llm.body.inferenceConfig).toEqual({
                maxTokens: 300,
                temperature: 0,
                topP: 1,
            });
        });
    });

    describe('setParameters - mutual exclusion of temperature and topP', () => {
        test('customer sets temperature only — removes topP default', () => {
            llm.setParameters({ temperature: 0.1, maxTokens: 1024 });
            expect(llm.body.inferenceConfig).toEqual({ maxTokens: 1024, temperature: 0.1 });
            expect(llm.body.inferenceConfig.topP).toBeUndefined();
        });

        test('customer sets topP only — removes temperature default', () => {
            llm.setParameters({ topP: 0.9, maxTokens: 1024 });
            expect(llm.body.inferenceConfig).toEqual({ maxTokens: 1024, topP: 0.9 });
            expect(llm.body.inferenceConfig.temperature).toBeUndefined();
        });

        test('customer sets both temperature and topP — both sent', () => {
            llm.setParameters({ temperature: 0.1, topP: 0.9 });
            expect(llm.body.inferenceConfig.temperature).toBe(0.1);
            expect(llm.body.inferenceConfig.topP).toBe(0.9);
        });

        test('customer sets neither — defaults unchanged', () => {
            llm.setParameters({ maxTokens: 1024 });
            expect(llm.body.inferenceConfig).toEqual({ maxTokens: 1024, temperature: 0, topP: 1 });
        });

        test('empty params — defaults unchanged', () => {
            llm.setParameters({});
            expect(llm.body.inferenceConfig).toEqual({ maxTokens: 300, temperature: 0, topP: 1 });
        });
    });

    describe('setParameters - additionalModelRequestFields', () => {
        test('sets top_k in additionalModelRequestFields', () => {
            llm.setParameters({ top_k: 250 });
            expect(llm.body.additionalModelRequestFields).toEqual({ top_k: 250 });
        });

        test('ignores unknown params', () => {
            llm.setParameters({ unknownParam: 'value' });
            expect(llm.body.inferenceConfig).toEqual({ maxTokens: 300, temperature: 0, topP: 1 });
            expect(llm.body.additionalModelRequestFields).toBeUndefined();
        });
    });

    describe('setPrompt', () => {
        test('sets messages with user role and text content', () => {
            llm.setPrompt('What is the weather?');
            expect(llm.body.messages).toEqual([{
                role: 'user',
                content: [{ type: 'text', text: 'What is the weather?' }]
            }]);
        });
    });

    describe('setSystemPrompt', () => {
        test('sets system prompt', () => {
            llm.setSystemPrompt('You are a helpful assistant.');
            expect(llm.body.system).toEqual([{ text: 'You are a helpful assistant.' }]);
        });
    });

    describe('setGuardrails', () => {
        test('sets guardrail config and appends guardContent to messages', () => {
            llm.setPrompt('test question');
            llm.setGuardrails({ guardrailId: 'g1', guardrailVersion: '1' }, 'test question', 'grounding text');
            expect(llm.body.guardrailConfig).toEqual({ guardrailId: 'g1', guardrailVersion: '1', trace: 'enabled' });
            expect(llm.body.messages[0].content).toHaveLength(3);
            expect(llm.body.messages[0].content[1].guardContent.text.qualifiers).toContain('query');
            expect(llm.body.messages[0].content[2].guardContent.text.qualifiers).toContain('grounding_source');
        });
    });
});
