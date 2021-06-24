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

exports.resources={

    "ResponseBotQNAYesNo": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNAYesNo-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA Yes No Bot - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.slotTypes": [
                  {
                    "slotTypeName": "QNAYesNoSlotType",
                    "slotTypeValues": [
                        {
                            "sampleValue": {"value": "Yes"},
                            "synonyms": [
                                {"value": 'Yes'},
                                {"value": 'OK'},
                                {"value": 'yeah'},
                                {"value": 'sure'},
                                {"value": 'yep'},
                                {"value": 'affirmative'},
                                {"value": 'aye'},
                                {"value": 'correct'},
                                {"value": 'one'},
                                {"value": '1'},
                            ]
                        },
                        {
                            "sampleValue": {"value": "No"},
                            "synonyms": [
                                {"value": 'no'},
                                {"value": 'nope'},
                                {"value": 'na'},
                                {"value": 'negative'},
                                {"value": 'non'},
                                {"value": 'incorrect'},
                                {"value": 'Two'},
                                {"value": '2'},
                            ]
                        }
                    ],
                     "valueSelectionSetting": {
                        "resolutionStrategy": "TopResolution"
                    }
                  }
                ],
                "CR.intents": [{
                    "intentName": "YesNoIntent",
                    "sampleUtterances": [
                        {"utterance": "{Yes_No}"},
                        {"utterance": "I said {Yes_No}"}
                    ],
                    "intentClosingSetting": {
                        "closingResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "OK. "}}
                            }]
                        }
                    },
                    "CR.slots": [{
                        "slotName": "Yes_No",
                        "CR.slotTypeName": "QNAYesNoSlotType",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "Say Yes or No."}}
                                }],
                                "maxRetries": 2,
                                "allowInterrupt": "True"
                            }
                        }
                    }]
                }],
            }]
        }
    },
    
  "ResponseBotQNAYesNoVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAYesNo" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNAYesNo","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNAYesNo","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNAYesNoAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAYesNo" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNAYesNoVersion" },
            "botAliasLocaleSettings": {
                "en_US": {"enabled": "True"}
            }
        }
    },
    
    "ResponseBotQNAYesNoExit": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNAYesNoExit-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA Yes No Exit Bot - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.slotTypes": [
                  {
                    "slotTypeName": "QNAYesNoExitSlotType",
                    "slotTypeValues": [
                        {
                            "sampleValue": {"value": "Yes"},
                            "synonyms": [
                                {"value": 'Yes'},
                                {"value": 'OK'},
                                {"value": 'yeah'},
                                {"value": 'sure'},
                                {"value": 'yep'},
                                {"value": 'affirmative'},
                                {"value": 'aye'},
                                {"value": 'correct'},
                                {"value": 'one'},
                                {"value": '1'},
                            ]
                        },
                        {
                            "sampleValue": {"value": "No"},
                            "synonyms": [
                                {"value": 'no'},
                                {"value": 'nope'},
                                {"value": 'na'},
                                {"value": 'negative'},
                                {"value": 'non'},
                                {"value": 'incorrect'},
                                {"value": 'Two'},
                                {"value": '2'},
                            ]
                        },
                        {
                            "sampleValue": {"value": "Exit"},
                            "synonyms": [
                                {"value": 'agent'},
                                {"value": 'rep'},
                                {"value": 'representative'},
                                {"value": 'stop'},
                                {"value": 'quit'},
                                {"value": 'help'},
                                {"value": 'bye'},
                                {"value": 'goodbye'},
                                {"value": 'three'},
                                {"value": '3'}
                            ]
                        }
                    ],
                     "valueSelectionSetting": {
                        "resolutionStrategy": "TopResolution"
                    }
                  }
                ],
                "CR.intents": [{
                    "intentName": "YesNoExitIntent",
                    "sampleUtterances": [
                        {"utterance": "{Yes_No_Exit}"},
                        {"utterance": "I said {Yes_No_Exit}"}
                    ],
                    "intentClosingSetting": {
                        "closingResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "OK. "}}
                            }]
                        }
                    },
                    "CR.slots": [{
                        "slotName": "Yes_No_Exit",
                        "CR.slotTypeName": "QNAYesNoExitSlotType",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "Say Yes, No, or Exit."}}
                                }],
                                "maxRetries": 2,
                                "allowInterrupt": "True"
                            }
                        }
                    }]
                }],
            }]
        }
    },
    
  "ResponseBotQNAYesNoExitVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAYesNoExit" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNAYesNoExit","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNAYesNoExit","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNAYesNoExitAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAYesNoExit" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNAYesNoExitVersion" },
            "botAliasLocaleSettings": {
                "en_US": {"enabled": "True"}
            }
        }
    },
    
    "ResponseBotQNAPin": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNAPin-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA PIN Bot - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.slotTypes": [
                  {
                     "slotTypeName": "QNAPinSlotType",
                     "valueSelectionSetting": {
                        "resolutionStrategy": "OriginalValue",
                        "regexFilter": {
                            "pattern": "[0-9]{4}"
                        }
                    },
                    "parentSlotTypeSignature": "AMAZON.AlphaNumeric"
                  }
                ],
                "CR.intents": [{
                    "intentName": "PINIntent",
                    "sampleUtterances": [
                        {"utterance": "The pin number is {Pin}"},
                        {"utterance": "My pin number is {Pin}"},
                        {"utterance": "It is {Pin}"},
                        {"utterance": "{Pin}"}
                    ],
                    "intentConfirmationSetting": {
                        "promptSpecification": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "<speak>Is <say-as interpret-as=\"digits\">{Pin}</say-as> correct (Yes or No)?"}}
                            }],
                            "maxRetries":1
                        },
                        "declinationResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "I'm sorry I did not get all the digits, please re-enter all digits."}}
                            }]
                        }
                    }, 
                    "intentClosingSetting": {
                        "closingResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "OK. "}}
                            }]
                        }
                    },
                    "CR.slots": [{
                        "slotName": "Pin",
                        "CR.slotTypeName": "QNAPinSlotType",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "What are all the digits?"}}
                                }],
                                "maxRetries": 2,
                                "allowInterrupt": "True"
                            }
                        }
                    }]
                }],
            }]
        }
    },
    
  "ResponseBotQNAPinVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAPin" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNAPin","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNAPin","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNAPinAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAPin" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNAPinVersion" },
            "botAliasLocaleSettings": {
                "en_US": {"enabled": "True"}
            }
        }
    },
    

    "ResponseBotQNAPinNoConfirm": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNAPinNoConfirm-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA PIN Bot (NoConfirm) - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.slotTypes": [
                  {
                     "slotTypeName": "QNAPinNoConfirmSlotType",
                     "valueSelectionSetting": {
                        "resolutionStrategy": "OriginalValue",
                        "regexFilter": {
                            "pattern": "[0-9]{4}"
                        }
                    },
                    "parentSlotTypeSignature": "AMAZON.AlphaNumeric",
                  }
                ],
                "CR.intents": [{
                    "intentName": "PINNoConfirmIntent",
                    "sampleUtterances": [
                        {"utterance": "The pin number is {Pin}"},
                        {"utterance": "My pin number is {Pin}"},
                        {"utterance": "It is {Pin}"},
                        {"utterance": "{Pin}"}
                    ],
                    "intentClosingSetting": {
                        "closingResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "OK. "}}
                            }]
                        }
                    },
                    "CR.slots": [{
                        "slotName": "Pin",
                        "CR.slotTypeName": "QNAPinNoConfirmSlotType",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "What are all the digits?"}}
                                }],
                                "maxRetries": 2,
                                "allowInterrupt": "True"
                            }
                        }
                    }]
                }],
            }]
        }
    },
    
  "ResponseBotQNAPinNoConfirmVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAPinNoConfirm" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNAPinNoConfirm","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNAPinNoConfirm","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNAPinNoConfirmAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAPinNoConfirm" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNAPinNoConfirmVersion" },
            "botAliasLocaleSettings": {
                "en_US": {"enabled": "True"}
            }
        }
    },
    
    "ResponseBotQNASocialSecurity": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNASocialSecurity-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA SocialSecurity Bot - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.slotTypes": [
                  {
                     "slotTypeName": "QNASocialSecuritySlotType",
                     "valueSelectionSetting": {
                        "resolutionStrategy": "OriginalValue",
                        "regexFilter": {
                            "pattern": "[0-9]{3}-[0-9]{2}-[0-9]{4}"
                        }
                    },
                    "parentSlotTypeSignature": "AMAZON.AlphaNumeric",
                  }
                ],
                "CR.intents": [{
                    "intentName": "SocialSecurityIntent",
                    "sampleUtterances": [
                        {"utterance": "The social security number is {SSN}"},
                        {"utterance": "My social security number is {SSN}"},
                        {"utterance": "It is {SSN}"},
                        {"utterance": "{SSN}"}
                    ],
                    "intentConfirmationSetting": {
                        "promptSpecification": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Is {SSN} correct (Yes/No)?"}}
                            }],
                            "maxRetries":1
                        },
                        "declinationResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Please let me know the social security number again?"}}
                            }]
                        }
                    }, 
                    "intentClosingSetting": {
                        "closingResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "OK. "}}
                            }]
                        }
                    },
                    "CR.slots": [{
                        "slotName": "SSN",
                        "CR.slotTypeName": "QNASocialSecuritySlotType",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "What is your social security number?"}}
                                }],
                                "maxRetries": 2,
                                "allowInterrupt": "True"
                            }
                        }
                    }]
                }],
            }]
        }
    },
    
  "ResponseBotQNASocialSecurityVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNASocialSecurity" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNASocialSecurity","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNASocialSecurity","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNASocialSecurityAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNASocialSecurity" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNASocialSecurityVersion" },
            "botAliasLocaleSettings": {
                "en_US": {"enabled": "True"}
            }
        }
    },
    

    "ResponseBotQNAWage": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNAWage-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA Wage Bot - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.slotTypes": [
                  {
                     "slotTypeName": "QNAWageSlotType",
                     "valueSelectionSetting": {
                        "resolutionStrategy": "OriginalValue",
                        "regexFilter": {
                            "pattern": "[0-9]{1,7}"
                        }
                    },
                    "parentSlotTypeSignature": "AMAZON.AlphaNumeric",
                  }
                ],
                "CR.intents": [{
                    "intentName": "WageIntent",
                    "sampleUtterances": [
                        {"utterance": "My salary is {Wage}"},
                        {"utterance": "My wage is {Wage}"},
                        {"utterance": "{Wage}"}
                    ],
                    "intentConfirmationSetting": {
                        "promptSpecification": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Is {Wage} correct (Yes/No)?"}}
                            }],
                            "maxRetries":1
                        },
                        "declinationResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Please let me what your wage was again?"}}
                            }]
                        }
                    }, 
                    "intentClosingSetting": {
                        "closingResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "OK. "}}
                            }]
                        }
                    },
                    "CR.slots": [{
                        "slotName": "Wage",
                        "CR.slotTypeName": "QNAWageSlotType",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "What is your wage?"}}
                                }],
                                "maxRetries": 2,
                                "allowInterrupt": "True"
                            }
                        }
                    }]
                }],
            }]
        }
    },
    
  "ResponseBotQNAWageVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAWage" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNAWage","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNAWage","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNAWageAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAWage" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNAWageVersion" },
            "botAliasLocaleSettings": {
                "en_US": {"enabled": "True"}
            }
        }
    },

    "ResponseBotQNAName": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNAName-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA Name Bot - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.intents": [{
                    "intentName": "NameIntent",
                    "sampleUtterances": [
                        {"utterance": "My last name is {LastName}"},
                        {"utterance": "My first name is {FirstName}"},
                        {"utterance": "My first name is {FirstName} and My last name is {LastName}"},
                        {"utterance": "My name is {FirstName} {LastName}"},
                        {"utterance": "I am {FirstName} {LastName}"},
                        {"utterance": "{FirstName} {LastName}"},
                        {"utterance": "{FirstName}"},
                        {"utterance": "{LastName}"}
                    ],
                    "intentConfirmationSetting": {
                        "promptSpecification": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Did I get your name right (Yes or No) {FirstName} {LastName}?"}}
                            }],
                            "maxRetries":1
                        },
                        "declinationResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Please let me know your name again?"}}
                            }]
                        }
                    }, 
                    "intentClosingSetting": {
                        "closingResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "OK. "}}
                            }]
                        }
                    },
                    "CR.slots": [{
                        "slotName": "FirstName",
                        "CR.slotTypeName": "AMAZON.FirstName",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "What is your first name?"}}
                                }],
                                "maxRetries": 2,
                                "allowInterrupt": "True"
                            }
                        }
                    },{
                        "slotName": "LastName",
                        "CR.slotTypeName": "AMAZON.LastName",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "What is your last name?"}}
                                }],
                                "maxRetries": 2,
                                "allowInterrupt": "True"
                            }
                        }
                    }]
                }],
            }]
        }
    },
    
  "ResponseBotQNANameVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAName" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNAName","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNAName","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNANameAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAName" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNANameVersion" },
            "botAliasLocaleSettings": {
                "en_US": {"enabled": "True"}
            }
        }
    },
    
    "ResponseBotQNAAge": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNAAge-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA Age Bot - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.intents": [{
                    "intentName": "AgeIntent",
                    "sampleUtterances": [
                        {"utterance": "My age is {Age}"},
                        {"utterance": "Age is {Age}"},
                        {"utterance": "It is {Age}"},
                        {"utterance": "I am {Age}"},
                        {"utterance": "I am {Age} years old"},
                        {"utterance": "His age is {Age}"},
                        {"utterance": "He is {Age}"},
                        {"utterance": "He is {Age} years old"},
                        {"utterance": "Her age is {Age}"},
                        {"utterance": "She is {Age}"},
                        {"utterance": "She is {Age} years old"},
                        {"utterance": "{Age}"}
                    ],
                    "intentConfirmationSetting": {
                        "promptSpecification": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Is {Age} correct (Yes or No)?"}}
                            }],
                            "maxRetries":1
                        },
                        "declinationResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Please let me know the age again?"}}
                            }]
                        }
                    }, 
                    "intentClosingSetting": {
                        "closingResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "OK. "}}
                            }]
                        }
                    },
                    "CR.slots": [{
                        "slotName": "Age",
                        "CR.slotTypeName": "AMAZON.Number",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "What age?"}}
                                }],
                                "maxRetries": 2,
                                "allowInterrupt": "True"
                            }
                        }
                    }]
                }],
            }]
        }
    },
    
  "ResponseBotQNAAgeVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAAge" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNAAge","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNAAge","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNAAgeAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAAge" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNAAgeVersion" },
            "botAliasLocaleSettings": {
                "en_US": {"enabled": "True"}
            }
        }
    }
    
};


exports.names=[
    "QNAAge", "QNAName", "QNAWage", "QNASocialSecurity", "QNAPinNoConfirm", "QNAPin", "QNAYesNo", "QNAYesNoExit" 
] ;


exports.outputs=_.fromPairs(exports.names.map(x=>{
    return [x,{Value:{ "Fn::Join" : [ "", [ "LexV2::", {"Ref":"ResponseBot" + x}, "/", {"Ref":"ResponseBot" + x + "Alias"}, "/", "en_US"  ] ] }}];
}));

