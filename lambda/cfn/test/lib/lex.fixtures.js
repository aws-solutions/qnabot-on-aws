/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the License). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

exports.slotTypeObject = function() {
    const response = {
        slotTypes: [ 
            { 
               createdDate: 'mock_creation_date',
               description: 'mock_description',
               lastUpdatedDate: 'mock_num',
               name: 'mock_slot_type',
               version: 'mock_version'
            }
         ],
         nextToken: 'mock_token',
         slotTypeVersion: 'QNABOT-AUTO-ASSIGNED'
    }

    return response;
}

exports.intentsObject = function() {
    const response = {
        intents: [ 
            { 
               createdDate: 'mock_creation_date',
               description: 'mock_description',
               lastUpdatedDate: 'mock_num',
               name: 'mock_intent',
               version: 'mock_version'
            }
         ],
         nextToken: 'mock_next_token'
    }

    return response;
}

exports.botVersionObject = function() {
    const response = {
        bots: [ 
            { 
               createdDate: 'mock_created_date',
               description: 'mock_description',
               lastUpdatedDate: 1,
               name: 'mock_name',
               status: 'mock_status',
               version: 'mock_version'
            }
         ],
         nextToken: 'mock_next_token'
    }
 
    return response;
}

exports.botAliasObject = function() {
    const response = {
        botName: 'mock_bot_name',
        botVersion: 'mock_bot_version',
        checksum: 'mock_checksum',
        conversationLogs: { 
           iamRoleArn: 'mock_iam_role_arn',
           logSettings: [ 
              { 
                 destination: 'mock_destination',
                 kmsKeyArn: 'mock_kms_key_arn',
                 logType: 'mock_log_type',
                 resourceArn: 'mock_resource_arn',
                 resourcePrefix: 'mock_resource_prefix'
              }
           ]
        },
        createdDate: 1,
        description: 'mock_description',
        lastUpdatedDate: 2,
        name: 'mock_name',
        childDirected: true,
        detectSentiment: true,
        createVersion: true
     }

     return response;
}

exports.intentObject = function() {
    const response = {
        createVersion: true,
        sampleUtterances: [
            'My age is {Age}',
            'Age is {Age}',
            'It is {Age}',
            'I am {Age}',
            'I am {Age} years old',
            'His age is {Age}',
            'He is {Age}',
            'He is {Age} years old',
            'Her age is {Age}',
            'She is {Age}',
            'She is {Age} years old',
            '{Age}',
        ],
        rejectionStatement: {
            messages: [
                {
                    contentType: 'PlainText',
                    content: 'Please let me know the age again.',
                },
            ],
        },
        slots: [
            {
                valueElicitationPrompt: {
                    maxAttempts: '2',
                    messages: [
                    {
                        contentType: 'PlainText',
                        content: 'What age?',
                    },
                    ],
            },
            slotConstraint: 'Required',
            slotType: 'AMAZON.NUMBER',
            name: 'Age',
            priority: '1',
            },
        ],
        conclusionStatement: {
            messages: [
            {
                contentType: 'PlainText',
                content: 'OK. ',
            },
            ],
        },
        confirmationPrompt: {
            maxAttempts: '1',
            messages: [
            {
                contentType: 'PlainText',
                content: 'Is {Age} correct (Yes or No)?',
            },
            ],
        },
        name: 'mock_intent',
        description: 'mock_description',
        fulfillmentActivity: {
            type: 'ReturnIntent',
        }
    }
    
    return response;
}

exports.botObject = function() {
    const response = {
        createVersion: true,
        voiceId : 'mock_voice_id',
        intents: [
            {
                intentName: 'mock_intent_name',
                intentVersion: '1'
            }
        ],
        clarificationPrompt: {
            maxAttempts: '3',
            messages: [
                {
                    contentType: 'PlainText',
                    content: 'mock_content'
                }
            ]
        },
        name: 'mock_bot_name',
        description: 'mock_bot_description',
        childDirected: false,
        locale: 'en-US',
        abortStatement: {
            messages: [
                {
                    contentType: 'PlainText',
                    content: 'mock_abort_content'
                }
            ]
        },
        processBehavior: 'BUILD'
    }
    
    return response;
}