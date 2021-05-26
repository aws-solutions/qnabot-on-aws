/**
 *
 * SlotTypes, Intents, and Bots for elicit response bots.
 *
 * Warning : Important Note: If you update an Intent or a SlotType, it is mandatory to update the description
 * in the associated Bot. Failure to do so when running an update will leave the bot in the NOT_BUILT state and you
 * will need to rebuild in the AWS Console. To update description for all bots, change botDateVersion string below.
 */
const botDateVersion = process.env.npm_package_version + " - v1";  // CHANGE ME TO FORCE BOT REBUILD

var _ = require('lodash');

var config={
    "voiceId":"Joanna",
    "Clarification":"Sorry, can you please repeat that?",
    "Abort":"Sorry, I could not understand. Please start again.",
    "utterances":require('../../../assets/default-utterances')
};

exports.resources={
    "WageSlotType":{
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexSlotType",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAWageSlotType-${AWS::StackName}"},
            "createVersion" : true,
            "description": "QNA Wage Slot Type - " + botDateVersion,
            "parentSlotTypeSignature": "AMAZON.AlphaNumeric",
            "slotTypeConfigurations": [
                {
                    "regexConfiguration": {
                        "pattern" : "[0-9]{1,7}"
                    }
                }
            ]
        }
    },
    "QNAWage": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": "WageIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAWageBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "WageIntent"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat your wage."
                    }
                ],
                "maxAttempts": 3
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            },
            "description": "QNA Wage elicit response - " + botDateVersion,
        }
    },
    "WageIntent": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAWageIntent-${AWS::StackName}"},
            "createVersion": true,
            "description": "QNA Wage Intent - " + botDateVersion,
            "sampleUtterances": [
                "My salary is {Wage}",
                "My wage is {Wage}",
                "{Wage}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "OK. ",
                        contentType: "PlainText"
                    }
                ],
            },
            confirmationPrompt: {
                maxAttempts: 1,
                messages: [
                    {
                        content: "Is {Wage} correct (Yes/No)?",
                        contentType: "PlainText"
                    }
                ]
            },
            rejectionStatement: {
                messages: [
                    {
                        content: "Please let me what your wage was again?",
                        contentType: "PlainText"
                    }
                ]
            },
            description: "Parse wage responses.",
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"Wage",
                    "slotType":{"Ref":"WageSlotType"},
                    "slotTypeVersion":"QNABOT-AUTO-ASSIGNED",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "What is your wage?"
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "WageAliasV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNAWage"
            },
            "name": "live",
            "description": "QNA Wage Alias - " + botDateVersion
        }
    },
    "SocialSecuritySlotType":{
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexSlotType",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNASocialSecuritySlotType-${AWS::StackName}"},
            "createVersion": true,
            "description": "QNA Social Security Slot Type - " + botDateVersion,
            "parentSlotTypeSignature": "AMAZON.AlphaNumeric",
            "slotTypeConfigurations": [
                {
                    "regexConfiguration": {
                        "pattern" : "[0-9]{3}-[0-9]{2}-[0-9]{4}"
                    }
                }
            ]
        }
    },
    "QNASocialSecurity": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": "SocialSecurityIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNASocialSecurityBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "SocialSecurityIntent"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat your social security number."
                    }
                ],
                "maxAttempts": 3
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            },
            "description": "QNA Social Security elicit response - " + botDateVersion,
        }
    },
    "SocialSecurityIntent": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNASocialSecurityIntent-${AWS::StackName}"},
            "createVersion": true,
            "description": "QNA Social Security Intent - " + botDateVersion,
            "sampleUtterances": [
                "The social security number is {SSN}",
                "My social security number is {SSN}",
                "It is {SSN}",
                "{SSN}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "OK. ",
                        contentType: "PlainText"
                    }
                ],
            },
            confirmationPrompt: {
                maxAttempts: 1,
                messages: [
                    {
                        content: "Is {SSN} correct (Yes/No)?",
                        contentType: "PlainText"
                    }
                ]
            },
            rejectionStatement: {
                messages: [
                    {
                        content: "Please let me know the social security number again?",
                        contentType: "PlainText"
                    }
                ]
            },
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"SSN",
                    "slotType":{"Ref":"SocialSecuritySlotType"},
                    "slotTypeVersion":"QNABOT-AUTO-ASSIGNED",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "What is your social security number?"
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "SocialSecurityAliasV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNASocialSecurity"
            },
            "name": "live",
            "description": "QNA Social Security Alias - " + botDateVersion
        }
    },
    "PinSlotType":{
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexSlotType",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAPinSlotType-${AWS::StackName}"},
            "description": "QNA Pin Slot Type - " + botDateVersion,
            "parentSlotTypeSignature": "AMAZON.AlphaNumeric",
            "createVersion": true,
            "slotTypeConfigurations": [
                {
                    "regexConfiguration": {
                        "pattern" : "[0-9]{4}"
                    }
                }
            ]
        }
    },
    "QNAPin": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": "PinIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAPinBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "PinIntent"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "I'm sorry I did not get all the digits, please re-enter all digits."
                    }
                ],
                "maxAttempts": 3
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            },
            "description": "QNA Pin elicit response - " + botDateVersion,
        }
    },
    "PinIntent": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAPinIntent-${AWS::StackName}"},
            "description": "QNA Pin Intent - " + botDateVersion,
            "createVersion": true,
            "sampleUtterances": [
                "The pin number is {Pin}",
                "My pin number is {Pin}",
                "It is {Pin}",
                "{Pin}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "OK. ",
                        contentType: "PlainText"
                    }
                ],
            },
            confirmationPrompt: {
                maxAttempts: 1,
                messages: [
                    {
                        content: "<speak>Is <say-as interpret-as=\"digits\">{Pin}</say-as> correct (Yes or No)?</speak>",
                        contentType: "PlainText"
                    }
                ]
            },
            rejectionStatement: {
                messages: [
                    {
                        content: "I'm sorry I did not get all the digits, please re-enter all digits.",
                        contentType: "PlainText"
                    }
                ]
            },
            description: "Parse pin responses.",
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"Pin",
                    "slotType":{"Ref":"PinSlotType"},
                    "slotTypeVersion":"QNABOT-AUTO-ASSIGNED",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "What are all the digits?"
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "PinAliasV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNAPin"
            },
            "name": "live",
            "description": "QNA Pin Alias - " + botDateVersion
        }
    },
    "QNAPinNoConfirm": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": "PinIntentNoConfirm",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAPinBotNoConfirm-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "PinIntentNoConfirm"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "I'm sorry I did not get all the digits, please re-enter all digits."
                    }
                ],
                "maxAttempts": 3
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            },
            "description": "QNA Pin No Confirm elicit response - " + botDateVersion,
        }
    },
    "PinIntentNoConfirm": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAPinIntentNoConfirm-${AWS::StackName}"},
            "description": "QNA Pin Intent No Confirm - " + botDateVersion,
            "createVersion": true,
            "sampleUtterances": [
                "The pin number is {Pin}",
                "My pin number is {Pin}",
                "It is {Pin}",
                "{Pin}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "OK. ",
                        contentType: "PlainText"
                    }
                ],
            },
            description: "Parse pin responses.",
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"Pin",
                    "slotType":{"Ref":"PinSlotType"},
                    "slotTypeVersion":"QNABOT-AUTO-ASSIGNED",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "What are all the digits?"
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "PinNoConfirmAliasV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNAPinNoConfirm"
            },
            "name": "live",
            "description": "QNA Pin No Confirm Alias - " + botDateVersion
        }
    },
    "YesNoSlotType":{
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexSlotType",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAYesNoSlotType-${AWS::StackName}"},
            "description": "QNA Yes No Slot Type - " + botDateVersion,
            "createVersion": true,
            "valueSelectionStrategy": "TOP_RESOLUTION",
            "enumerationValues": [
                {"value":"Yes", "synonyms":["yes", "ok","yeah","sure","yep","affirmative","aye", "correct", "1", "one"]},
                {"value":"No", "synonyms":["no", "nope","na","negative","non", "2", "two"]}
              ]
        }
    },
    "YesNoIntent": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAYesNoIntent-${AWS::StackName}"},
            "createVersion": true,
            "description": "QNA Yes No Intent - " + botDateVersion,
            "sampleUtterances": [
                "{Yes_No}",
                "I said {Yes_No}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "OK. ",
                        contentType: "PlainText"
                    }
                ],
            },
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"Yes_No",
                    "slotType":{"Ref":"YesNoSlotType"},
                    "slotTypeVersion":"QNABOT-AUTO-ASSIGNED",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "Say Yes or No."
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "QNAYesNo": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": ["YesNoSlotType", "YesNoIntent"],
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAYesNoBot-${AWS::StackName}"},
            "description": "QNA Yes No Bot - " + botDateVersion,
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "YesNoIntent"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat - say Yes or No."
                    }
                ],
                "maxAttempts": 5
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            },
        }
    },
    "YesNoAliasV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "DependsOn": "QNAYesNo",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNAYesNo"
            },
            "name": "live",
            "description": "QNA Yes No Alias - " + botDateVersion,
        }
    },
    "YesNoExitSlotType":{
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexSlotType",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAYesNoExitSlotType-${AWS::StackName}"},
            "description": "QNA Yes No Exit Slot Type - " + botDateVersion,
            "createVersion": true,
            "valueSelectionStrategy": "TOP_RESOLUTION",
            "enumerationValues": [
                {"value":"Yes", "synonyms":["yes", "ok","yeah","sure","yep","affirmative","aye", "correct", "1", "one"]},
                {"value":"No", "synonyms":["no", "nope","na","negative","non", "2", "two"]},
                {"value":"Exit", "synonyms":["exit", "agent","rep","representative","stop","quit", "help", "bye", "goodbye", "3", "three"]}
            ]
        }
    },
    "YesNoExitIntent": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAYesNoExitIntent-${AWS::StackName}"},
            "createVersion": true,
            "description": "QNA Yes No Exit Intent - " + botDateVersion,
            "sampleUtterances": [
                "{Yes_No_Exit}",
                "I said {Yes_No_Exit}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "Ok. ",
                        contentType: "PlainText"
                    }
                ],
            },
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"Yes_No_Exit",
                    "slotType":{"Ref":"YesNoExitSlotType"},
                    "slotTypeVersion":"QNABOT-AUTO-ASSIGNED",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "Say Yes, No, or Exit."
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "QNAYesNoExit": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": ["YesNoExitSlotType", "YesNoExitIntent"],
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAYesNoExitBot-${AWS::StackName}"},
            "description": "QNA Yes No Exit Bot - " + botDateVersion,
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "YesNoExitIntent"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat - say Yes or No. You can also say exit, agent, quit, or bye to leave."
                    }
                ],
                "maxAttempts": 5
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            },
        }
    },
    "YesNoExitAliasV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "DependsOn": "QNAYesNoExit",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNAYesNoExit"
            },
            "name": "live",
            "description": "QNA Yes No Exit Alias - " + botDateVersion,
        }
    },
    "DateIntent": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNADateIntent-${AWS::StackName}"},
            "createVersion": true,
            "description": "QNA DateIntent - " + botDateVersion,
            "sampleUtterances": [
                "The date is {date}",
                "The date was {date}",
                "I went on {date}",
                "It is {date}",
                "It occurred on {date}",
                "I was born on {date}",
                "My birthdate is {date}",
                "My date of birth is {date}",
                "{date}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "OK. ",
                        contentType: "PlainText"
                    }
                ],
            },
            confirmationPrompt: {
                maxAttempts: 1,
                messages: [
                    {
                        content: "Is {date} correct (Yes or No)?",
                        contentType: "PlainText"
                    }
                ]
            },
            rejectionStatement: {
                messages: [
                    {
                        content: "Please let me know the date again?",
                        contentType: "PlainText"
                    }
                ]
            },
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"date",
                    "slotType": "AMAZON.DATE",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "What date?"
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "QNADate": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": "DateIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNADateBot-${AWS::StackName}"},
            "description": "QNA Date Bot - " + botDateVersion,
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "DateIntent"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat the date."
                    }
                ],
                "maxAttempts": 3
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            }
        }
    },
    "DateAliasV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "DependsOn": "QNADate",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNADate"
            },
            "name": "live",
            "description": "QNA Date Alias - " + botDateVersion
        }
    },
    "DateIntentNoConfirm": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNADateIntentNoConfirm-${AWS::StackName}"},
            "createVersion": true,
            "description": "QNA DateIntentNoConfirm - " + botDateVersion,
            "sampleUtterances": [
                "The date is {date}",
                "The date was {date}",
                "I went on {date}",
                "It is {date}",
                "It occurred on {date}",
                "I was born on {date}",
                "My birthdate is {date}",
                "My date of birth is {date}",
                "{date}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "OK. ",
                        contentType: "PlainText"
                    }
                ],
            },
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"date",
                    "slotType": "AMAZON.DATE",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "What date?"
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "QNADateNoConfirm": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": "DateIntentNoConfirm",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNADateBotNoConfirm-${AWS::StackName}"},
            "description": "QNA Date Bot No Confirm - " + botDateVersion,
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "DateIntentNoConfirm"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat the date."
                    }
                ],
                "maxAttempts": 3
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            }
        }
    },
    "DateAliasNoConfirmV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "DependsOn": "QNADateNoConfirm",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNADateNoConfirm"
            },
            "name": "live",
            "description": "QNA Date No Confirm Alias - " + botDateVersion
        }
    },
    "DayOfWeekIntent": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNADayOfWeekIntent-${AWS::StackName}"},
            "description": "QNA Day Of Week Intent - " + botDateVersion,
            "createVersion": true,
            "sampleUtterances": [
                "The day is {DayOfWeek}",
                "The day was {DayOfWeek}",
                "I went on {DayOfWeek}",
                "It is {DayOfWeek}",
                "It occurred on {DayOfWeek}",
                "{DayOfWeek}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "OK. ",
                        contentType: "PlainText"
                    }
                ],
            },
            confirmationPrompt: {
                maxAttempts: 1,
                messages: [
                    {
                        content: "Is {DayOfWeek} correct (Yes or No)?",
                        contentType: "PlainText"
                    }
                ]
            },
            rejectionStatement: {
                messages: [
                    {
                        content: "Please let me know the day again?",
                        contentType: "PlainText"
                    }
                ]
            },
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"DayOfWeek",
                    "slotType": "AMAZON.DayOfWeek",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "What day?"
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "QNADayOfWeek": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": "DayOfWeekIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNADayOfWeekBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "DayOfWeekIntent"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat the day of the week."
                    }
                ],
                "maxAttempts": 3
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            },
            "description": "QNADayOfWeek bot - " + botDateVersion,
        }
    },
    "DayOfWeekAliasV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "DependsOn": "QNADayOfWeek",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNADayOfWeek"
            },
            "name": "live",
            "description": "QNA Day Of Week Alias - " + botDateVersion
        }
    },
    "MonthIntent": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAMonthIntent-${AWS::StackName}"},
            "description": "QNA Month Intent - " + botDateVersion,
            "createVersion": true,
            "sampleUtterances": [
                "The month is {Month}",
                "The month was {Month}",
                "It is {Month}",
                "It occurred on {Month}",
                "{Month}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "OK. ",
                        contentType: "PlainText"
                    }
                ],
            },
            confirmationPrompt: {
                maxAttempts: 1,
                messages: [
                    {
                        content: "Is {Month} correct (Yes or No)?",
                        contentType: "PlainText"
                    }
                ]
            },
            rejectionStatement: {
                messages: [
                    {
                        content: "Please let me know the month again?",
                        contentType: "PlainText"
                    }
                ]
            },
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"Month",
                    "slotType": "AMAZON.Month",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "What month?"
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "QNAMonth": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": "MonthIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAMonthBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "MonthIntent"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat the month."
                    }
                ],
                "maxAttempts": 3
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            },
            "description": "QNA Month Bot - " + botDateVersion,
        }
    },
    "MonthAliasV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "DependsOn": "QNAMonth",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNAMonth"
            },
            "name": "live",
            "description": "QNA Month Alias - " + botDateVersion
        }
    },
    "MonthIntentNoConfirm": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAMonthIntentNoConfirm-${AWS::StackName}"},
            "description": "QNA Month Intent No Confirm - " + botDateVersion,
            "createVersion": true,
            "sampleUtterances": [
                "The month is {Month}",
                "The month was {Month}",
                "It is {Month}",
                "It occurred on {Month}",
                "{Month}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "OK. ",
                        contentType: "PlainText"
                    }
                ],
            },
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"Month",
                    "slotType": "AMAZON.Month",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "What month?"
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "QNAMonthNoConfirm": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": "MonthIntentNoConfirm",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAMonthBotNoConfirm-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "MonthIntentNoConfirm"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat the month."
                    }
                ],
                "maxAttempts": 3
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            },
            "description": "QNA Month Bot No Confirm - " + botDateVersion,
        }
    },
    "MonthAliasNoConfirmV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "DependsOn": "QNAMonthNoConfirm",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNAMonthNoConfirm"
            },
            "name": "live",
            "description": "QNA Month Alias No Confirm - " + botDateVersion
        }
    },
    "NumberIntent": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNANumberIntent-${AWS::StackName}"},
            "description": "QNA Number Intent - " + botDateVersion,
            "createVersion": true,
            "sampleUtterances": [
                "The number is {Number}",
                "The number was {Number}",
                "It is {Number}",
                "{Number}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "OK. ",
                        contentType: "PlainText"
                    }
                ],
            },
            confirmationPrompt: {
                maxAttempts: 1,
                messages: [
                    {
                        content: "<speak>Is <say-as interpret-as=\"digits\">{Number}</say-as> correct (Yes or No)?</speak>",
                        contentType: "PlainText"
                    }
                ]
            },
            rejectionStatement: {
                messages: [
                    {
                        content: "Please let me know the number again?",
                        contentType: "PlainText"
                    }
                ]
            },
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"Number",
                    "slotType": "AMAZON.NUMBER",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "What number?"
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "QNANumber": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": "NumberIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNANumberBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "NumberIntent"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat the number."
                    }
                ],
                "maxAttempts": 3
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            },
            "description": "QNA Number Bot - " + botDateVersion,
        }
    },
    "NumberAliasV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "DependsOn": "QNANumber",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNANumber"
            },
            "name": "live",
            "description": "QNA Number Alias - " + botDateVersion
        }
    },
    "NumberIntentNoConfirm": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNANumberIntentNoConfirm-${AWS::StackName}"},
            "description": "QNA Number Intent No Confirm - " + botDateVersion,
            "createVersion": true,
            "sampleUtterances": [
                "The number is {Number}",
                "The number was {Number}",
                "It is {Number}",
                "{Number}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "OK. ",
                        contentType: "PlainText"
                    }
                ],
            },
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"Number",
                    "slotType": "AMAZON.NUMBER",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "What number?"
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "QNANumberNoConfirm": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": "NumberIntentNoConfirm",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNANumberBotNoConfirm-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "NumberIntentNoConfirm"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat the number."
                    }
                ],
                "maxAttempts": 3
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            },
            "description": "QNA Number Bot No Confirm - " + botDateVersion,
        }
    },
    "NumberAliasNoConfirmV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "DependsOn": "QNANumberNoConfirm",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNANumberNoConfirm"
            },
            "name": "live",
            "description": "QNA Number Alias No Confirm - " + botDateVersion
        }
    },
    "AgeIntent": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAAgeIntent-${AWS::StackName}"},
            "description": "QNA Age Intent - " + botDateVersion,
            "createVersion": true,
            "sampleUtterances": [
                "My age is {Age}",
                "Age is {Age}",
                "It is {Age}",
                "I am {Age}",
                "I am {Age} years old",
                "His age is {Age}",
                "He is {Age}",
                "He is {Age} years old",
                "Her age is {Age}",
                "She is {Age}",
                "She is {Age} years old",
                "{Age}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "OK. ",
                        contentType: "PlainText"
                    }
                ],
            },
            confirmationPrompt: {
                maxAttempts: 1,
                messages: [
                    {
                        content: "Is {Age} correct (Yes or No)?",
                        contentType: "PlainText"
                    }
                ]
            },
            rejectionStatement: {
                messages: [
                    {
                        content: "Please let me know the age again?",
                        contentType: "PlainText"
                    }
                ]
            },
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"Age",
                    "slotType": "AMAZON.NUMBER",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "What age?"
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "QNAAge": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": "AgeIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAAgeBot-${AWS::StackName}"},
            "description": "QNA Age Bot - " + botDateVersion,
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "AgeIntent"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat the age."
                    }
                ],
                "maxAttempts": 3
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            }
        }
    },
    "AgeAliasV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "DependsOn": "QNAAge",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNAAge"
            },
            "name": "live",
            "description": "QNA Age Alias - " + botDateVersion
        }
    },
    "PhoneNumberIntent": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAPhoneNumberIntent-${AWS::StackName}"},
            "description": "QNA Phone Number Intent - " + botDateVersion,
            "createVersion": true,
            "sampleUtterances": [
                "The phone number is {PhoneNumber}",
                "My phone number is {PhoneNumber}",
                "It is {PhoneNumber}",
                "{PhoneNumber}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "OK. ",
                        contentType: "PlainText"
                    }
                ],
            },
            confirmationPrompt: {
                maxAttempts: 1,
                messages: [
                    {
                        // QnABot always uses postText to interact with response bot, however, it supports embedded SSML tags in
                        // the confirmation prompt so that speech back to Alexa or Lex client in postContent mode.
                        // SSML tags are automatically stripped by QnABot for text mode clients.
                        content: '<speak>Is <say-as interpret-as="telephone">{PhoneNumber}</say-as> correct (Yes or No)?</speak>',
                        contentType: "PlainText"
                    }
                ]
            },
            rejectionStatement: {
                messages: [
                    {
                        content: "Please let me know the phone number again?",
                        contentType: "PlainText"
                    }
                ]
            },
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"PhoneNumber",
                    "slotType": "AMAZON.PhoneNumber",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "What phone number?"
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "QNAPhoneNumber": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": "PhoneNumberIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAPhoneNumberBot-${AWS::StackName}"},
            "description": "QNA Phone Number Bot - " + botDateVersion,
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "PhoneNumberIntent"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat the phone number."
                    }
                ],
                "maxAttempts": 3
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            }
        }
    },
    "PhoneNumberAliasV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "DependsOn": "QNAPhoneNumber",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNAPhoneNumber"
            },
            "name": "live",
            "description": "QNA Phone Number Alias - " + botDateVersion
        }
    },
    "PhoneNumberIntentNoConfirm": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAPhoneNumberIntentNoConfirm-${AWS::StackName}"},
            "description": "QNA Phone Number Intent No Confirm - " + botDateVersion,
            "createVersion": true,
            "sampleUtterances": [
                "The phone number is {PhoneNumber}",
                "My phone number is {PhoneNumber}",
                "It is {PhoneNumber}",
                "{PhoneNumber}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "OK. ",
                        contentType: "PlainText"
                    }
                ],
            },
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"PhoneNumber",
                    "slotType": "AMAZON.PhoneNumber",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "What phone number?"
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "QNAPhoneNumberNoConfirm": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": "PhoneNumberIntentNoConfirm",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAPhoneNumberBotNoConfirm-${AWS::StackName}"},
            "description": "QNA Phone Number Bot No Confirm - " + botDateVersion,
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "PhoneNumberIntentNoConfirm"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat the phone number."
                    }
                ],
                "maxAttempts": 3
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            }
        }
    },
    "PhoneNumberAliasNoConfirmV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "DependsOn": "QNAPhoneNumberNoConfirm",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNAPhoneNumberNoConfirm"
            },
            "name": "live",
            "description": "QNA Phone Number Alias No Confirm - " + botDateVersion
        }
    },
    "TimeIntent": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNATimeIntent-${AWS::StackName}"},
            "description": "QNA Time Intent - " + botDateVersion,
            "createVersion": true,
            "sampleUtterances": [
                "The time was {Time}",
                "It occurred at {Time}",
                "At {Time}",
                "{Time}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "OK. ",
                        contentType: "PlainText"
                    }
                ],
            },
            confirmationPrompt: {
                maxAttempts: 1,
                messages: [
                    {
                        content: "Is {Time} correct (Yes or No)?",
                        contentType: "PlainText"
                    }
                ]
            },
            rejectionStatement: {
                messages: [
                    {
                        content: "Please let me know the time again?",
                        contentType: "PlainText"
                    }
                ]
            },
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"Time",
                    "slotType": "AMAZON.TIME",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "What time?"
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "QNATime": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": "TimeIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNATimeBot-${AWS::StackName}"},
            "description": "QNA Time Bot - " + botDateVersion,
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "TimeIntent"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat the time, specifying am or pm."
                    }
                ],
                "maxAttempts": 3
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            }
        }
    },
    "TimeAliasV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "DependsOn": "QNATime",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNATime"
            },
            "name": "live",
            "description": "QNA Time Alias - " + botDateVersion
        }
    },
    "EmailAddressIntent": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAEmailAddressIntent-${AWS::StackName}"},
            "description": "QNA Email Address Intent - " + botDateVersion,
            "createVersion": true,
            "sampleUtterances": [
                "My email address is {EmailAddress}",
                "The email address is {EmailAddress}",
                "{EmailAddress}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "OK. ",
                        contentType: "PlainText"
                    }
                ],
            },
            confirmationPrompt: {
                maxAttempts: 1,
                messages: [
                    {
                        content: "Is {EmailAddress} correct (Yes or No)?",
                        contentType: "PlainText"
                    }
                ]
            },
            rejectionStatement: {
                messages: [
                    {
                        content: "Please let me know the email address again?",
                        contentType: "PlainText"
                    }
                ]
            },
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"EmailAddress",
                    "slotType": "AMAZON.EmailAddress",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "What email address?"
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "QNAEmailAddress": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": "EmailAddressIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAEmailAddressBot-${AWS::StackName}"},
            "description": "QNA Email Address Intent - " + botDateVersion,
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "EmailAddressIntent"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat the email address."
                    }
                ],
                "maxAttempts": 3
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            }
        }
    },
    "EmailAddressAliasV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "DependsOn": "QNAEmailAddress",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNAEmailAddress"
            },
            "name": "live",
            "description": "QNA Email Address Alias - " + botDateVersion
        }
    },
    "NameIntent": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNANameIntent-${AWS::StackName}"},
            "description": "QNA Name Intent - " + botDateVersion,
            "createVersion": true,
            "sampleUtterances": [
                "My last name is {LastName}",
                "My first name is {FirstName}",
                "My first name is {FirstName} and My last name is {LastName}",
                "My name is {FirstName} {LastName}",
                "I am {FirstName} {LastName}",
                "{FirstName} {LastName}",
                "{FirstName}",
                "{LastName}"
            ],
            conclusionStatement: {
                messages: [
                    {
                        content: "OK. ",
                        contentType: "PlainText"
                    }
                ],
            },
            confirmationPrompt: {
                maxAttempts: 1,
                messages: [
                    {
                        content: "Did I get your name right (Yes or No) {FirstName} {LastName}?",
                        contentType: "PlainText"
                    }
                ]
            },
            rejectionStatement: {
                messages: [
                    {
                        content: "Please let me know your name again?",
                        contentType: "PlainText"
                    }
                ]
            },
            description: "Parse name responses.",
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
                {
                    "name":"FirstName",
                    "slotType": "AMAZON.US_FIRST_NAME",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "What is your first name?"
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                },
                {
                    "name":"LastName",
                    "slotType": "AMAZON.US_LAST_NAME",
                    "slotConstraint": "Required",
                    "valueElicitationPrompt": {
                        "messages": [
                            {
                                "contentType": "PlainText",
                                "content": "What is your last name?"
                            }
                        ],
                        "maxAttempts": 2
                    },
                    "priority": 1,
                }
            ],
        },
    },
    "QNAName": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexBot",
        "DependsOn": "NameIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNANameBot-${AWS::StackName}"},
            "description": "QNA Name Bot - " + botDateVersion,
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "createVersion": true,
            "intents": [
                {"intentName": {"Ref": "NameIntent"}},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat your first and last name?"
                    }
                ],
                "maxAttempts": 3
            },
            "abortStatement": {
                "messages": [
                    {
                        "content": config.Abort,
                        "contentType": "PlainText"
                    }
                ]
            }
        }
    },
    "NameAliasV2": {
        "Condition": "CreateLexV1Bots",
        "Type": "Custom::LexAlias",
        "DependsOn": "QNAName",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNAName"
            },
            "name": "live",
            "description": "QNA Name Alias - " + botDateVersion
        }
    }
};


exports.names=[
    "QNAYesNo", "QNAYesNoExit", "QNADate", "QNADateNoConfirm", "QNADayOfWeek", "QNAMonth", "QNAMonthNoConfirm",
    "QNANumber", "QNANumberNoConfirm", "QNAAge","QNAPhoneNumber", "QNAPhoneNumberNoConfirm",
    "QNATime", "QNAEmailAddress", "QNAName", "QNAWage","QNASocialSecurity","QNAPin", "QNAPinNoConfirm"
] ;


exports.outputs=_.fromPairs(exports.names.map(x=>{
    return [x,{Value:{"Fn::If": ["CreateLexV1Bots", {"Ref":x}, "ReponseBots not yet supported in LexV2-Only installations"]}}];
}));

