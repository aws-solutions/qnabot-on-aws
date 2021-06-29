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

    "ResponseBotQNADate": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNADate-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA Date Bot - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.intents": [{
                    "intentName": "DateIntent",
                    "sampleUtterances": [
                        {"utterance": "The date is {date}"},
                        {"utterance": "The date was {date}"},
                        {"utterance": "I went on {date}"},
                        {"utterance": "It is {date}"},
                        {"utterance": "It occurred on {date}"},
                        {"utterance": "I was born on {date}"},
                        {"utterance": "My birthdate is {date}"},
                        {"utterance": "My date of birth is {date}"},
                        {"utterance": "{date}"}
                    ],
                    "intentConfirmationSetting": {
                        "promptSpecification": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Is {date} correct (Yes or No)?"}}
                            }],
                            "maxRetries":1
                        },
                        "declinationResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Please let me know the date again?"}}
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
                        "slotName": "date",
                        "CR.slotTypeName": "AMAZON.Date",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "What date?"}}
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
    
  "ResponseBotQNADateVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNADate" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNADate","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNADate","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNADateAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNADate" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNADateVersion" },
            "botAliasLocaleSettings": {
                "en_US": {"enabled": "True"}
            }
        }
    },

    "ResponseBotQNADateNoConfirm": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNADateNoConfirm-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA Date Bot (NoConfirm) - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.intents": [{
                    "intentName": "DateNoConfirmIntent",
                    "sampleUtterances": [
                        {"utterance": "The date is {date}"},
                        {"utterance": "The date was {date}"},
                        {"utterance": "I went on {date}"},
                        {"utterance": "It is {date}"},
                        {"utterance": "It occurred on {date}"},
                        {"utterance": "I was born on {date}"},
                        {"utterance": "My birthdate is {date}"},
                        {"utterance": "My date of birth is {date}"},
                        {"utterance": "{date}"}
                    ],
                    "intentClosingSetting": {
                        "closingResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "OK. "}}
                            }]
                        }
                    },
                    "CR.slots": [{
                        "slotName": "date",
                        "CR.slotTypeName": "AMAZON.Date",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "What date?"}}
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
    
  "ResponseBotQNADateNoConfirmVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNADateNoConfirm" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNADateNoConfirm","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNADateNoConfirm","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNADateNoConfirmAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNADateNoConfirm" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNADateNoConfirmVersion" },
            "botAliasLocaleSettings": {
                "en_US": {"enabled": "True"}
            }
        }
    },

    "ResponseBotQNADayOfWeek": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNADayOfWeek-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA DayOfWeek Bot - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.slotTypes": [
                  {
                    "slotTypeName": "QNADayOfWeekSlotType",
                    "slotTypeValues": [
                        {
                            "sampleValue": {"value": "Sunday"},
                            "synonyms": [
                                {"value": 'Su'},
                                {"value": 'Sun'}
                            ]
                        },{
                            "sampleValue": {"value": "Monday"},
                            "synonyms": [
                                {"value": 'M'},
                                {"value": 'Mo'},
                                {"value": 'Mon'}
                            ]
                        },{
                            "sampleValue": {"value": "Tuesday"},
                            "synonyms": [
                                {"value": 'Tu'},
                                {"value": 'Tue'},
                                {"value": 'Tues'},
                            ]
                        },{
                            "sampleValue": {"value": "Wednesday"},
                            "synonyms": [
                                {"value": 'W'},
                                {"value": 'We'},
                                {"value": 'Wed'}
                            ]
                        },{
                            "sampleValue": {"value": "Thursday"},
                            "synonyms": [
                                {"value": 'Th'},
                                {"value": 'Thu'},
                                {"value": 'Thurs'},
                            ]
                        },{
                            "sampleValue": {"value": "Friday"},
                            "synonyms": [
                                {"value": 'F'},
                                {"value": 'Fr'},
                                {"value": 'Fri'}
                            ]
                        },{
                            "sampleValue": {"value": "Saturday"},
                            "synonyms": [
                                {"value": 'Sa'},
                                {"value": 'Sat'}
                            ]
                        }
                    ],
                     "valueSelectionSetting": {
                        "resolutionStrategy": "TopResolution"
                    }
                  }
                ],
                "CR.intents": [{
                    "intentName": "DayOfWeekIntent",
                    "sampleUtterances": [
                        {"utterance": "The day is {DayOfWeek}"},
                        {"utterance": "The day was {DayOfWeek}"},
                        {"utterance": "I went on {DayOfWeek}"},
                        {"utterance": "It is {DayOfWeek}"},
                        {"utterance": "It occurred on {DayOfWeek}"},
                        {"utterance": "{DayOfWeek}"}
                    ],
                    "intentConfirmationSetting": {
                        "promptSpecification": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Is {DayOfWeek} correct (Yes or No)?"}}
                            }],
                            "maxRetries":1
                        },
                        "declinationResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Please let me know the day of the week again?"}}
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
                        "slotName": "DayOfWeek",
                        "CR.slotTypeName": "QNADayOfWeekSlotType",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "What day of the week?"}}
                                }],
                                "maxRetries": 2,
                                "allowInterrupt": "True"
                            }
                        }
                    }]
                }]
            }]
        }
    },
    
  "ResponseBotQNADayOfWeekVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNADayOfWeek" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNADayOfWeek","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNADayOfWeek","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNADayOfWeekAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNADayOfWeek" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNADayOfWeekVersion" },
            "botAliasLocaleSettings": {
                "en_US": {"enabled": "True"}
            }
        }
    },

    "ResponseBotQNAMonth": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNAMonth-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA Month Bot - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.slotTypes": [
                  {
                    "slotTypeName": "QNAMonthSlotType",
                    "slotTypeValues": [
                        {
                            "sampleValue": {"value": "January"},
                            "synonyms": [
                                {"value": 'Jan'},
                                {"value": '01'}
                            ]
                        },{
                            "sampleValue": {"value": "February"},
                            "synonyms": [
                                {"value": 'Feb'},
                                {"value": '02'}
                            ]
                        },{
                            "sampleValue": {"value": "March"},
                            "synonyms": [
                                {"value": 'Mar'},
                                {"value": '03'}
                            ]
                        },{
                            "sampleValue": {"value": "April"},
                            "synonyms": [
                                {"value": 'Apr'},
                                {"value": '04'}
                            ]
                        },{
                            "sampleValue": {"value": "May"},
                            "synonyms": [
                                {"value": '05'}
                            ]
                        },{
                            "sampleValue": {"value": "June"},
                            "synonyms": [
                                {"value": 'Jun'},
                                {"value": '06'}
                            ]
                        },{
                            "sampleValue": {"value": "July"},
                            "synonyms": [
                                {"value": 'Jul'},
                                {"value": '07'}
                            ]
                        },{
                            "sampleValue": {"value": "August"},
                            "synonyms": [
                                {"value": 'Aug'},
                                {"value": '08'}
                            ]
                        },{
                            "sampleValue": {"value": "September"},
                            "synonyms": [
                                {"value": 'Sep'},
                                {"value": 'Sept'},
                                {"value": '09'}
                            ]
                        },{
                            "sampleValue": {"value": "October"},
                            "synonyms": [
                                {"value": 'Oct'},
                                {"value": '10'}
                            ]
                        },{
                            "sampleValue": {"value": "November"},
                            "synonyms": [
                                {"value": 'Nov'},
                                {"value": '11'}
                            ]
                        },{
                            "sampleValue": {"value": "December"},
                            "synonyms": [
                                {"value": 'Dec'},
                                {"value": '12'}
                            ]
                        },

                    ],
                     "valueSelectionSetting": {
                        "resolutionStrategy": "TopResolution"
                    }
                  }
                ],
                "CR.intents": [{
                    "intentName": "MonthIntent",
                    "sampleUtterances": [
                        {"utterance": "The month is {Month}"},
                        {"utterance": "The day was {Month}"},
                        {"utterance": "It is {Month}"},
                        {"utterance": "It occurred on {Month}"},
                        {"utterance": "{Month}"}
                    ],
                    "intentConfirmationSetting": {
                        "promptSpecification": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Is {Month} correct (Yes or No)?"}}
                            }],
                            "maxRetries":1
                        },
                        "declinationResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Please let me know the month again?"}}
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
                        "slotName": "Month",
                        "CR.slotTypeName": "QNAMonthSlotType",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "What month?"}}
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
    
  "ResponseBotQNAMonthVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAMonth" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNAMonth","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNAMonth","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNAMonthAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAMonth" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNAMonthVersion" },
            "botAliasLocaleSettings": {
                "en_US": {"enabled": "True"}
            }
        }
    },

    "ResponseBotQNAMonthNoConfirm": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNAMonthNoConfirm-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA Month Bot (NoConfirm) - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.slotTypes": [
                  {
                    "slotTypeName": "QNAMonthNoConfirmSlotType",
                    "slotTypeValues": [
                        {
                            "sampleValue": {"value": "January"},
                            "synonyms": [
                                {"value": 'Jan'},
                                {"value": '01'}
                            ]
                        },{
                            "sampleValue": {"value": "February"},
                            "synonyms": [
                                {"value": 'Feb'},
                                {"value": '02'}
                            ]
                        },{
                            "sampleValue": {"value": "March"},
                            "synonyms": [
                                {"value": 'Mar'},
                                {"value": '03'}
                            ]
                        },{
                            "sampleValue": {"value": "April"},
                            "synonyms": [
                                {"value": 'Apr'},
                                {"value": '04'}
                            ]
                        },{
                            "sampleValue": {"value": "May"},
                            "synonyms": [
                                {"value": '05'}
                            ]
                        },{
                            "sampleValue": {"value": "June"},
                            "synonyms": [
                                {"value": 'Jun'},
                                {"value": '06'}
                            ]
                        },{
                            "sampleValue": {"value": "July"},
                            "synonyms": [
                                {"value": 'Jul'},
                                {"value": '07'}
                            ]
                        },{
                            "sampleValue": {"value": "August"},
                            "synonyms": [
                                {"value": 'Aug'},
                                {"value": '08'}
                            ]
                        },{
                            "sampleValue": {"value": "September"},
                            "synonyms": [
                                {"value": 'Sep'},
                                {"value": 'Sept'},
                                {"value": '09'}
                            ]
                        },{
                            "sampleValue": {"value": "October"},
                            "synonyms": [
                                {"value": 'Oct'},
                                {"value": '10'}
                            ]
                        },{
                            "sampleValue": {"value": "November"},
                            "synonyms": [
                                {"value": 'Nov'},
                                {"value": '11'}
                            ]
                        },{
                            "sampleValue": {"value": "December"},
                            "synonyms": [
                                {"value": 'Dec'},
                                {"value": '12'}
                            ]
                        },

                    ],
                     "valueSelectionSetting": {
                        "resolutionStrategy": "TopResolution"
                    }
                  }
                ],
                "CR.intents": [{
                    "intentName": "MonthNoConfirmIntent",
                    "sampleUtterances": [
                        {"utterance": "The month is {Month}"},
                        {"utterance": "The day was {Month}"},
                        {"utterance": "It is {Month}"},
                        {"utterance": "It occurred on {Month}"},
                        {"utterance": "{Month}"}
                    ],
                    "intentClosingSetting": {
                        "closingResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "OK. "}}
                            }]
                        }
                    },
                    "CR.slots": [{
                        "slotName": "Month",
                        "CR.slotTypeName": "QNAMonthNoConfirmSlotType",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "What month?"}}
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
    
  "ResponseBotQNAMonthNoConfirmVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAMonthNoConfirm" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNAMonthNoConfirm","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNAMonthNoConfirm","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNAMonthNoConfirmAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAMonthNoConfirm" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNAMonthNoConfirmVersion" },
            "botAliasLocaleSettings": {
                "en_US": {"enabled": "True"}
            }
        }
    },

    "ResponseBotQNANumber": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNANumber-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA Number Bot - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.intents": [{
                    "intentName": "NumberIntent",
                    "sampleUtterances": [
                        {"utterance": "The number is {Number}"},
                        {"utterance": "The number was {Number}"},
                        {"utterance": "It is {Number}"},
                        {"utterance": "{Number}"}
                    ],
                    "intentConfirmationSetting": {
                        "promptSpecification": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "<speak>Is <say-as interpret-as=\"digits\">{Number}</say-as> correct (Yes or No)?</speak>"}}
                            }],
                            "maxRetries":1
                        },
                        "declinationResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Please let me know the number again?"}}
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
                        "slotName": "Number",
                        "CR.slotTypeName": "AMAZON.Number",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "What  number?"}}
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
    
  "ResponseBotQNANumberVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNANumber" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNANumber","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNANumber","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNANumberAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNANumber" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNANumberVersion" },
            "botAliasLocaleSettings": {
                "en_US": {"enabled": "True"}
            }
        }
    },
    
    "ResponseBotQNANumberNoConfirm": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNANumberNoConfirm-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA Number Bot (NoConfirm) - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.intents": [{
                    "intentName": "NumberNoConfirmIntent",
                    "sampleUtterances": [
                        {"utterance": "The number is {Number}"},
                        {"utterance": "The number was {Number}"},
                        {"utterance": "It is {Number}"},
                        {"utterance": "{Number}"}
                    ],
                    "intentClosingSetting": {
                        "closingResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "OK. "}}
                            }]
                        }
                    },
                    "CR.slots": [{
                        "slotName": "Number",
                        "CR.slotTypeName": "AMAZON.Number",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "What number?"}}
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
    
  "ResponseBotQNANumberNoConfirmVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNANumberNoConfirm" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNANumberNoConfirm","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNANumberNoConfirm","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNANumberNoConfirmAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNANumberNoConfirm" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNANumberNoConfirmVersion" },
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
    },

    "ResponseBotQNAPhoneNumber": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNAPhoneNumber-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA Phone Number Bot - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.intents": [{
                    "intentName": "PhoneNumberIntent",
                    "sampleUtterances": [
                        {"utterance": "The phone number is {PhoneNumber}"},
                        {"utterance": "My phone number is {PhoneNumber}"},
                        {"utterance": "It is {PhoneNumber}"},
                        {"utterance": "{PhoneNumber}"}
                    ],
                    "intentConfirmationSetting": {
                        "promptSpecification": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "<speak>Is <say-as interpret-as=\"telephone\">{PhoneNumber}</say-as> correct (Yes or No)?</speak>"}}
                            }],
                            "maxRetries":1
                        },
                        "declinationResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Please let me know the phone number again?"}}
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
                        "slotName": "PhoneNumber",
                        "CR.slotTypeName": "AMAZON.PhoneNumber",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "What phone number?"}}
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
    
  "ResponseBotQNAPhoneNumberVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAPhoneNumber" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNAPhoneNumber","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNAPhoneNumber","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNAPhoneNumberAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAPhoneNumber" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNAPhoneNumberVersion" },
            "botAliasLocaleSettings": {
                "en_US": {"enabled": "True"}
            }
        }
    },
    
    "ResponseBotQNAPhoneNumberNoConfirm": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNAPhoneNumberNoConfirm-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA Phone Number Bot (NoConfirm) - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.intents": [{
                    "intentName": "NumberNoConfirmIntent",
                    "sampleUtterances": [
                        {"utterance": "The phone number is {PhoneNumber}"},
                        {"utterance": "My phone number is {PhoneNumber}"},
                        {"utterance": "It is {PhoneNumber}"},
                        {"utterance": "{PhoneNumber}"}
                    ],
                    "intentClosingSetting": {
                        "closingResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "OK. "}}
                            }]
                        }
                    },
                    "CR.slots": [{
                        "slotName": "PhoneNumber",
                        "CR.slotTypeName": "AMAZON.PhoneNumber",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "What phone number?"}}
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
    
  "ResponseBotQNAPhoneNumberNoConfirmVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAPhoneNumberNoConfirm" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNAPhoneNumberNoConfirm","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNAPhoneNumberNoConfirm","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNAPhoneNumberNoConfirmAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAPhoneNumberNoConfirm" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNAPhoneNumberNoConfirmVersion" },
            "botAliasLocaleSettings": {
                "en_US": {"enabled": "True"}
            }
        }
    },

    "ResponseBotQNATime": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNATime-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA Time Bot - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.intents": [{
                    "intentName": "TimeIntent",
                    "sampleUtterances": [
                        {"utterance": "The time was {Time}"},
                        {"utterance": "The time is {Time}"},
                        {"utterance": "It occurred at {Time}"},
                        {"utterance": "At {Time}"},
                        {"utterance": "{Time}"}
                    ],
                    "intentConfirmationSetting": {
                        "promptSpecification": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Is {Time} correct (Yes or No)?"}}
                            }],
                            "maxRetries":1
                        },
                        "declinationResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Please let me know the time again?"}}
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
                        "slotName": "Time",
                        "CR.slotTypeName": "AMAZON.Time",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "What time?"}}
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
    
  "ResponseBotQNATimeVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNATime" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNATime","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNATime","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNATimeAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNATime" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNATimeVersion" },
            "botAliasLocaleSettings": {
                "en_US": {"enabled": "True"}
            }
        }
    },

    "ResponseBotQNAEmailAddress": {
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botName": {"Fn::Sub":"ResponseBot-QNAEmailAddress-${AWS::StackName}"},
            "dataPrivacy": {"childDirected": "False"},
            "description": "QNA Email Address Bot - " + botDateVersion,
            "idleSessionTTLInSeconds": "300",
            "roleArn": { "Ref":"LexV2ServiceLinkedRoleARN" },
            "CR.botLocales": [{
                "localeId": "en_US",
                "nluIntentConfidenceThreshold": "0.40",
                "voiceSettings": {"voiceId":"Salli"},
                "CR.intents": [{
                    "intentName": "EmailAddressIntent",
                    "sampleUtterances": [
                        {"utterance": "My email address is {EmailAddress}"},
                        {"utterance": "The email address is {EmailAddress}"},
                        {"utterance": "{EmailAddress}"}
                    ],
                    "intentConfirmationSetting": {
                        "promptSpecification": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Is {EmailAddress} correct (Yes or No)?"}}
                            }],
                            "maxRetries":1
                        },
                        "declinationResponse": {
                            "messageGroups": [{
                                "message": {"plainTextMessage": {"value": "Please let me know the email address again?"}}
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
                        "slotName": "EmailAddress",
                        "CR.slotTypeName": "AMAZON.EmailAddress",
                        "valueElicitationSetting": {
                            "slotConstraint": "Required",
                            "promptSpecification": {
                                "messageGroups": [{
                                    "message": { "plainTextMessage": {"value": "What email address?"}}
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
    
  "ResponseBotQNAEmailAddressVersion": {
        "DeletionPolicy": "Retain",
        "UpdateReplacePolicy": "Retain",
        "Type": "Custom::LexBotVersion",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAEmailAddress" },
            "CR.botLocaleIds": {"Fn::GetAtt":["ResponseBotQNAEmailAddress","botLocaleIds"]},
            "CR.lastUpdatedDateTime": {"Fn::GetAtt":["ResponseBotQNAEmailAddress","lastUpdatedDateTime"]}
        }
  },

  "ResponseBotQNAEmailAddressAlias": {
        "DeletionPolicy": "Retain",
        "Type": "Custom::LexBotAlias",
        "Properties": {
            "ServiceToken": { "Ref":"LexV2CFNLambdaARN" },
            "botId": { "Ref":"ResponseBotQNAEmailAddress" },
            "botAliasName": "live",
            "botVersion": { "Ref":"ResponseBotQNAEmailAddressVersion" },
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
    }
    
};


exports.names=[
    "QNAWage", "QNASocialSecurity", "QNAPinNoConfirm", "QNAPin", "QNAYesNo", "QNAYesNoExit", "QNADate", "QNADateNoConfirm", "QNADayOfWeek", "QNAMonthNoConfirm", "QNAMonthNoConfirm", 
    "QNANumber", "QNANumberNoConfirm", "QNAAge", "QNAPhoneNumber", "QNAPhoneNumberNoConfirm", "QNATime", "QNAEmailAddress", "QNAName"
] ;


exports.outputs=_.fromPairs(exports.names.map(x=>{
    return [x,{Value:{ "Fn::Join" : [ "", [ "LexV2::", {"Ref":"ResponseBot" + x}, "/", {"Ref":"ResponseBot" + x + "Alias"}, "/", "en_US"  ] ] }}];
}));

