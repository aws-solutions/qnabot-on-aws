/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const { BedrockRuntimeClient, ApplyGuardrailCommand } = require('@aws-sdk/client-bedrock-runtime');
const { mockClient } = require('aws-sdk-client-mock');
const { applyGuardrail } = require('../lib/bedrock/applyGuardrail.js');



require('aws-sdk-client-mock-jest');
jest.mock('qnabot/settings');
jest.mock('qnabot/logging');
jest.mock('@aws-sdk/client-bedrock-runtime');

const bedrockMock = mockClient(BedrockRuntimeClient);

describe('applyGuardrail', () => {
  beforeEach(() => {
    bedrockMock.reset();
  });

  it('should return original text when guardrail action is NONE', async () => {
    const testInput = {
      guardrailIdentifier: 'test-id',
      guardrailVersion: '1.0',
      source: 'test-source',
      text: 'original text'
    };

    bedrockMock
      .on(ApplyGuardrailCommand)
      .resolvesOnce({
        action: 'NONE',
        outputs: [{ text: 'modified text' }],
        assessments: [{
          guardrailProcessingLatency: 50
        }]
      });

    const result = await applyGuardrail(
      testInput.guardrailIdentifier,
      testInput.guardrailVersion,
      testInput.source,
      testInput.text
    );

    expect(result).toEqual({
      text: 'original text',
      guardrailAction: 'NONE',
    });

    expect(bedrockMock).toHaveReceivedCommandTimes(ApplyGuardrailCommand, 1);
  });

  it('should return modified text when guardrail action is GUARDRAIL_INTERVENED', async () => {
    const testInput = {
      guardrailIdentifier: 'test-id',
      guardrailVersion: '1.0',
      source: 'test-source',
      text: 'original text'
    };

    bedrockMock
      .on(ApplyGuardrailCommand)
      .resolves({
        action: 'GUARDRAIL_INTERVENED',
        outputs: [{ text: 'modified text' }],
        assessments: [{
          guardrailProcessingLatency: 50
        }]
      });

    const result = await applyGuardrail(
      testInput.guardrailIdentifier,
      testInput.guardrailVersion,
      testInput.source,
      testInput.text
    );

    expect(result).toEqual({
      text: 'modified text',
      guardrailAction: 'GUARDRAIL_INTERVENED'
    });
  });

  it('should handle error cases', async () => {
    const testInput = {
      guardrailIdentifier: 'test-id',
      guardrailVersion: '1.0',
      source: 'test-source',
      text: 'original text'
    };

    bedrockMock
      .on(ApplyGuardrailCommand)
      .rejects(new Error('API Error'));

    const result = await applyGuardrail(
      testInput.guardrailIdentifier,
      testInput.guardrailVersion,
      testInput.source,
      testInput.text
    );

    expect(result).toEqual({
      text: undefined,
      guardrailAction: 'ERROR',
      piiEntityAction: 'ERROR'
    });

  });


  it('should handle multiple calls with different responses', async () => {
    const testInput = {
      guardrailIdentifier: 'test-id',
      guardrailVersion: '1.0',
      source: 'test-source',
      text: 'original text'
    };

    bedrockMock
      .on(ApplyGuardrailCommand)
      .resolvesOnce({
        action: 'NONE',
        outputs: [{ text: 'first response' }],
        assessments: [{
          guardrailProcessingLatency: 50
        }]
      })
      .resolvesOnce({
        action: 'GUARDRAIL_INTERVENED',
        outputs: [{ text: 'second response' }],
        assessments: [{
          guardrailProcessingLatency: 50
        }]
      });

    // First call
    const result1 = await applyGuardrail(
      testInput.guardrailIdentifier,
      testInput.guardrailVersion,
      testInput.source,
      testInput.text
    );

    expect(result1).toEqual({
      text: 'original text',
      guardrailAction: 'NONE'
    });

    // Second call
    const result2 = await applyGuardrail(
      testInput.guardrailIdentifier,
      testInput.guardrailVersion,
      testInput.source,
      testInput.text
    );

    expect(result2).toEqual({
      text: 'second response',
      guardrailAction: 'GUARDRAIL_INTERVENED'
    });
  });

  it('should handle multiple PII entities and return action', async () => {
    const testInput = {
      guardrailIdentifier: 'test-id',
      guardrailVersion: '1.0',
      source: 'test-source',
      text: 'original text'
    };

    bedrockMock
      .on(ApplyGuardrailCommand)
      .resolves({
        action: 'GUARDRAIL_INTERVENED',
        outputs: [{ text: 'modified text' }],
        assessments: [{
          sensitiveInformationPolicy: {
            piiEntities: [
              { action: 'BLOCKED' },
            ]
          }
        }]
      });

    const result = await applyGuardrail(
      testInput.guardrailIdentifier,
      testInput.guardrailVersion,
      testInput.source,
      testInput.text
    );

    expect(result).toEqual({
      text: 'modified text',
      guardrailAction: 'GUARDRAIL_INTERVENED',
      piiEntityAction: 'BLOCKED'  
    });
  });

  it('should handle missing piiEntities in sensitiveInformationPolicy', async () => {
    const testInput = {
      guardrailIdentifier: 'test-id',
      guardrailVersion: '1.0',
      source: 'test-source',
      text: 'original text'
    };

    bedrockMock
      .on(ApplyGuardrailCommand)
      .resolves({
        action: 'NONE',
        outputs: [{ text: 'modified text' }],
        assessments: [{
          sensitiveInformationPolicy: {}  // No piiEntities
        }]
      });

    const result = await applyGuardrail(
      testInput.guardrailIdentifier,
      testInput.guardrailVersion,
      testInput.source,
      testInput.text
    );

    expect(result).toEqual({
      text: 'original text',
      guardrailAction: 'NONE',
      piiEntityAction: undefined
    });
  });

});
