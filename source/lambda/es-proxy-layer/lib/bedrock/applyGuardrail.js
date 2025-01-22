/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const { BedrockRuntimeClient, ApplyGuardrailCommand } = require('@aws-sdk/client-bedrock-runtime');
const region = process.env.AWS_REGION || 'us-east-1';
const qnabot = require('qnabot/logging');
const customSdkConfig = require('sdk-config/customSdkConfig');
const client = new BedrockRuntimeClient(customSdkConfig('C42', { region }));

async function applyGuardrail(guardrailIdentifier, guardrailVersion, source, text, errorMessage) {
  try {

    const input = {
      guardrailIdentifier, 
      guardrailVersion,
      source, 
      content: [ 
        { 
          text: { 
            text,
          },
        },
      ],
    };
  
    qnabot.log('Invoking ApplyGuardrail API: ', JSON.stringify(input, null, 2));
    const command = new ApplyGuardrailCommand(input);
    const response = await client.send(command);
    qnabot.debug('Bedrock ApplyGuardrail API Debug Response: ', JSON.stringify(response, null, 2)); 
  
    const guardrailAction = response?.action;
    qnabot.log(`Bedrock Guardrail Action: ${guardrailAction}`);
  
    const piiEntityAction = response?.assessments[0]?.sensitiveInformationPolicy?.piiEntities?.[0]?.action;
    if (piiEntityAction) {
      qnabot.log(`Guardail Sensitive Information Detected and PII Entity Action Taken: ${piiEntityAction}`);
    };
    
    return {
      text: guardrailAction === 'GUARDRAIL_INTERVENED' ? response.outputs[0].text : text,
      guardrailAction, 
      piiEntityAction,
    };

  } catch (error) {
    qnabot.error(`Error occurred in Guardrail API Failed: ${error.name}: ${error.message.substring(0, 500)}`);

    return {
      text: errorMessage,
      guardrailAction: 'ERROR',
      piiEntityAction: 'ERROR',
    };
  }
}

exports.applyGuardrail = applyGuardrail; 