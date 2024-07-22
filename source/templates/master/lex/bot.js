/** *******************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 ******************************************************************************************************************** */

const config = require('./config');

// must change this version to force upgrades to reapply across the entire Bot echo system
const qnabotversion = `${process.env.npm_package_version} - v1`;

module.exports = {
    QNAInvokePermission: {
        Type: 'AWS::Lambda::Permission',
        DependsOn: 'FulfillmentLambdaAliaslive',
        Properties: {
            Action: 'lambda:InvokeFunction',
            FunctionName: {
                'Fn::Join': [':', [
                    { 'Fn::GetAtt': ['FulfillmentLambda', 'Arn'] },
                    'live',
                ]],
            },
            Principal: 'lex.amazonaws.com',
            SourceAccount: { Ref: 'AWS::AccountId' }, 
        },
    },
    SlotType: {
        Type: 'Custom::LexSlotType',
        Condition: 'CreateLexV1Bots',
        Properties: {
            ServiceToken: { 'Fn::GetAtt': ['CFNLambda', 'Arn'] },
            createVersion: true,
            description: `custom slot type ${qnabotversion}`,
            enumerationValues: config.utterances.map((x) => ({ value: x })),
        },
    },
    Intent: {
        Type: 'Custom::LexIntent',
        Condition: 'CreateLexV1Bots',
        Properties: {
            ServiceToken: {
                'Fn::GetAtt': ['CFNLambda', 'Arn'],
            },
            prefix: 'fulfilment',
            description: `custom intent ${qnabotversion}`,
            createVersion: true,
            sampleUtterances: [
                '{slot}',
            ],
            slots: [{
                name: 'slot',
                slotType: { Ref: 'SlotType' },
                slotConstraint: 'Optional',
                slotTypeVersion: 'QNABOT-AUTO-ASSIGNED',
                priority: 1,
            },
            ],
            fulfillmentActivity: {
                type: 'CodeHook',
                codeHook: {
                    uri: {
                        'Fn::Join': [':', [
                            { 'Fn::GetAtt': ['FulfillmentLambda', 'Arn'] },
                            'live',
                        ]],
                    },
                    messageVersion: '1.0',
                },
            },
        },
        DependsOn: 'QNAInvokePermission',
    },
    IntentFallback: {
        Type: 'Custom::LexIntent',
        Condition: 'CreateLexV1Bots',
        Properties: {
            ServiceToken: {
                'Fn::GetAtt': ['CFNLambda', 'Arn'],
            },
            prefix: 'qnabotfallbackfulfilment',
            description: `custom fallback intent ${qnabotversion}`,
            createVersion: true,
            fulfillmentActivity: {
                type: 'CodeHook',
                codeHook: {
                    uri: {
                        'Fn::Join': [':', [
                            { 'Fn::GetAtt': ['FulfillmentLambda', 'Arn'] },
                            'live',
                        ]],
                    },
                    messageVersion: '1.0',
                },
            },
            parentIntentSignature: 'AMAZON.FallbackIntent',
        },
        DependsOn: 'QNAInvokePermission',
    },
    LexBot: {
        Type: 'Custom::LexBot',
        Condition: 'CreateLexV1Bots',
        Properties: {
            ServiceToken: {
                'Fn::GetAtt': [
                    'CFNLambda',
                    'Arn',
                ],
            },
            name: { 'Fn::Sub': '${AWS::StackName}-Bot' },
            description: `QnABot primary bot ${qnabotversion}`,
            locale: 'en-US',
            voiceId: config.voiceId,
            childDirected: false,
            createVersion: true,
            intents: [
                { intentName: { Ref: 'Intent' } },
                { intentName: { Ref: 'IntentFallback' } },
            ],
            abortStatement: {
                messages: [
                    {
                        content: config.Abort,
                        contentType: 'PlainText',
                    },
                ],
            },
        },
    },
    VersionAlias: {
        Type: 'Custom::LexAlias',
        Condition: 'CreateLexV1Bots',
        DependsOn: 'LexBot',
        Properties: {
            ServiceToken: {
                'Fn::GetAtt': [
                    'CFNLambda',
                    'Arn',
                ],
            },
            botName: {
                Ref: 'LexBot',
            },
            name: 'live',
            description: `QnABot live alias ${qnabotversion}`,
        },
    },
    LexV2Bot: {
        Type: 'Custom::LexV2Bot',
        Properties: {
            ServiceToken: {
                'Fn::GetAtt': [
                    'Lexv2BotLambda',
                    'Arn',
                ],
            },
            description: `QnABot LexV2 Bot${qnabotversion}`,
            BuildDate: (new Date()).toISOString(),
            localIds: { Ref: 'LexV2BotLocaleIds' },
            utterances: config.utterances,
        },
    },
};
