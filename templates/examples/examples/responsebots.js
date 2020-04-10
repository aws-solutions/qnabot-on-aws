/**
 *
 * SlotTypes, Intents, and Bots for elicit response bots.
 *
 * Warning : Important Note: If you update an Intent or a SlotType, it is mandatory to update the description
 * in the associated Bot. Failure to do so when running an update will leave the bot in the NOT_BUILT state and you
 * will need to rebuild in the AWS Console. To update description for all bots, change botDateVersion string below.
 */
const botDateVersion = "04/09/2020 v2";  // CHANGE ME TO FORCE BOT REBUILD

var _ = require('lodash');

var config={
    "voiceId":"Joanna",
    "Clarification":"Sorry, can you please repeat that?",
    "Abort":"Sorry, I could not understand. Please start again.",
    "utterances":require('../../../assets/default-utterances')
};

exports.resources={
    "WageSlotType":{
        "Type": "Custom::LexSlotType",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAWageSlotType-${AWS::StackName}"},
            "parentSlotTypeSignature": "AMAZON.AlphaNumeric",
            "slotTypeConfigurations": [
                {
                    "regexConfiguration": {
                        "pattern" : "[0-9]{1,5}" 
                    }
                }
            ]
        }
    },
    "QNAWage": {
        "Type": "Custom::LexBot",
        "DependsOn": "WageIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAWageBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "intents": [
                {"intentName": {"Ref": "WageIntent"},"intentVersion": "$LATEST"},
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
            }
        }
    },
    "WageIntent": {
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAWageIntent-${AWS::StackName}"},
            "sampleUtterances": [
                "My salary is {Wage}",
                "I made {SSN}",
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
                "slotTypeVersion":"$LATEST",
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

    //social-security responseBot
    "SocialSecuritySlotType":{
        "Type": "Custom::LexSlotType",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNASocialSecuritySlotType-${AWS::StackName}"},
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
        "Type": "Custom::LexBot",
        "DependsOn": "SocialSecurityIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNASocialSecurityBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "intents": [
                {"intentName": {"Ref": "SocialSecurityIntent"},"intentVersion": "$LATEST"},
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
            }
        }
    },
    "SocialSecurityIntent": {
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNASocialSecurityIntent-${AWS::StackName}"},
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
            description: "Parse social security responses.",
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
              {
                "name":"SSN",
                "slotType":{"Ref":"SocialSecuritySlotType"},
                "slotTypeVersion":"$LATEST",
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

    //Pin responseBot
    "PinSlotType":{
        "Type": "Custom::LexSlotType",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAPinSlotType-${AWS::StackName}"},
            "parentSlotTypeSignature": "AMAZON.AlphaNumeric",
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
        "Type": "Custom::LexBot",
        "DependsOn": "PinIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAPinBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "intents": [
                {"intentName": {"Ref": "PinIntent"},"intentVersion": "$LATEST"},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat your pin number."
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
    "PinIntent": {
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAPinIntent-${AWS::StackName}"},
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
                        content: "Is {Pin} correct (Yes/No)?",
                        contentType: "PlainText"
                    }
                ]
            },
            rejectionStatement: {
                messages: [
                    {
                        content: "Please let me know the pin number again?",
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
                "slotTypeVersion":"$LATEST",
                "slotConstraint": "Required",
                "valueElicitationPrompt": {
                  "messages": [
                    {
                      "contentType": "PlainText",
                      "content": "What is your pin number?"
                    }
                  ],
                  "maxAttempts": 2
                },
                "priority": 1,
              }
            ],
        },
    },


    //BYE code responseBot
    "ByeCodeSlotType":{
        "Type": "Custom::LexSlotType",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAByeCodeSlotType-${AWS::StackName}"},
            "parentSlotTypeSignature": "AMAZON.AlphaNumeric",
            "slotTypeConfigurations": [
                {
                    "regexConfiguration": {
                        "pattern" : "[0-9]{2}" 
                    }
                }
            ]
        }
    },
    "QNAByeCode": {
        "Type": "Custom::LexBot",
        "DependsOn": "ByeCodeIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAByeCodeBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "intents": [
                {"intentName": {"Ref": "ByeCodeIntent"},"intentVersion": "$LATEST"},
            ],
            "clarificationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "Please repeat your BYE code."
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
    "ByeCodeIntent": {
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAByeCodeIntent-${AWS::StackName}"},
            "sampleUtterances": [
                "The bye code is {ByeCode}",
                "My bye code is {ByeCode}",
                "It is {ByeCode}",
                "{ByeCode}"
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
                        content: "Is {ByeCode} correct (Yes/No)?",
                        contentType: "PlainText"
                    }
                ]
            },
            rejectionStatement: {
                messages: [
                    {
                        content: "Please let me know the BYE code again?",
                        contentType: "PlainText"
                    }
                ]
            },
            description: "Parse BYE code responses.",
            fulfillmentActivity: {
                type: "ReturnIntent"
            },
            "slots": [
              {
                "name":"ByeCode",
                "slotType":{"Ref":"ByeCodeSlotType"},
                "slotTypeVersion":"$LATEST",
                "slotConstraint": "Required",
                "valueElicitationPrompt": {
                  "messages": [
                    {
                      "contentType": "PlainText",
                      "content": "What is your BYE code?"
                    }
                  ],
                  "maxAttempts": 2
                },
                "priority": 1,
              }
            ],
        },
    },
    // Yes_No ResponseBot
    "YesNoSlotType":{
        "Type": "Custom::LexSlotType",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAYesNoSlotType-${AWS::StackName}"},
            "valueSelectionStrategy": "TOP_RESOLUTION",
            "enumerationValues": [
                {"value":"Yes", "synonyms":["OK","Yeah","Sure","Yep","Affirmative","aye"]},
                {"value":"No", "synonyms":["Nope","Na","Negative","Non"]}
              ]
        }
    },
    "YesNoIntent": {
      "Type": "Custom::LexIntent",
      "Properties": {
        "ServiceToken": {"Ref": "CFNLambda"},
        "name":{"Fn::Sub":"QNAYesNoIntent-${AWS::StackName}"},
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
        description: "Parse Yes or No responses.", 
        fulfillmentActivity: {
          type: "ReturnIntent"
        },
        "slots": [
          {
            "name":"Yes_No",
            "slotType":{"Ref":"YesNoSlotType"},
            "slotTypeVersion":"$LATEST",
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
      "Type": "Custom::LexBot",
      "DependsOn": ["YesNoSlotType", "YesNoIntent"],
      "Properties": {
        "ServiceToken": {"Ref": "CFNLambda"},
        "name":{"Fn::Sub":"QNAYesNoBot-${AWS::StackName}"},
        "locale": "en-US",
        "voiceId": config.voiceId,
        "childDirected": false,
        "intents": [
            {"intentName": {"Ref": "YesNoIntent"},"intentVersion": "$LATEST"},
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
        "description": "QNA Custom Yes or No elicit response bot - " + botDateVersion,
      }
    },
    "YesNoAlias": {
      "Type": "Custom::LexAlias",
      "DependsOn": "QNAYesNo",
      "Properties": {
        "ServiceToken": {"Ref": "CFNLambda"},
        "botName": {
          "Ref": "QNAYesNo"
        },
        "botVersion": "$LATEST"
      }
    },
    "DateIntent": {
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNADateIntent-${AWS::StackName}"},
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
            description: "Parse date responses.",
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
        "Type": "Custom::LexBot",
        "DependsOn": "DateIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNADateBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "intents": [
                {"intentName": {"Ref": "DateIntent"},"intentVersion": "$LATEST"},
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
            },
            "description": "QNADate response bot - " + botDateVersion,
        }
    },
    "DateAlias": {
        "Type": "Custom::LexAlias",
        "DependsOn": "QNADate",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNADate"
            },
            "botVersion": "$LATEST"
        }
    },
    "DayOfWeekIntent": {
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNADayOfWeekIntent-${AWS::StackName}"},
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
            description: "Parse day responses.",
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
        "Type": "Custom::LexBot",
        "DependsOn": "DayOfWeekIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNADayOfWeekBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "intents": [
                {"intentName": {"Ref": "DayOfWeekIntent"},"intentVersion": "$LATEST"},
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
            "description": "QNADayOfWeek response bot - " + botDateVersion,
        }
    },
    "DayOfWeekAlias": {
        "Type": "Custom::LexAlias",
        "DependsOn": "QNADayOfWeek",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNADayOfWeek"
            },
            "botVersion": "$LATEST"
        }
    },
    "MonthIntent": {
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAMonthIntent-${AWS::StackName}"},
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
            description: "Parse day responses.",
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
        "Type": "Custom::LexBot",
        "DependsOn": "MonthIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAMonthBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "intents": [
                {"intentName": {"Ref": "MonthIntent"},"intentVersion": "$LATEST"},
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
            "description": "QNAMonth response bot - " + botDateVersion,
        }
    },
    "MonthAlias": {
        "Type": "Custom::LexAlias",
        "DependsOn": "QNAMonth",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNAMonth"
            },
            "botVersion": "$LATEST"
        }
    },
    "NumberIntent": {
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNANumberIntent-${AWS::StackName}"},
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
                        content: "Is {Number} correct (Yes or No)?",
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
            description: "Parse number responses.",
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
        "Type": "Custom::LexBot",
        "DependsOn": "NumberIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNANumberBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "intents": [
                {"intentName": {"Ref": "NumberIntent"},"intentVersion": "$LATEST"},
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
            "description": "QNANumber response bot - " + botDateVersion,
        }
    },
    "NumberAlias": {
        "Type": "Custom::LexAlias",
        "DependsOn": "QNANumber",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNANumber"
            },
            "botVersion": "$LATEST"
        }
    },
    "AgeIntent": {
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAAgeIntent-${AWS::StackName}"},
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
            description: "Parse Age responses.",
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
        "Type": "Custom::LexBot",
        "DependsOn": "AgeIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAAgeBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "intents": [
                {"intentName": {"Ref": "AgeIntent"},"intentVersion": "$LATEST"},
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
            },
            "description": "QNAAge response bot - " + botDateVersion,
        }
    },
    "AgeAlias": {
        "Type": "Custom::LexAlias",
        "DependsOn": "QNAAge",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNAAge"
            },
            "botVersion": "$LATEST"
        }
    },
    "PhoneNumberIntent": {
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAPhoneNumberIntent-${AWS::StackName}"},
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
            description: "Parse phone number responses.",
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
        "Type": "Custom::LexBot",
        "DependsOn": "PhoneNumberIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAPhoneNumberBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "intents": [
                {"intentName": {"Ref": "PhoneNumberIntent"},"intentVersion": "$LATEST"},
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
            },
            "description": "QNAPhoneNumber response bot - " + botDateVersion,
        }
    },
    "PhoneNumberAlias": {
        "Type": "Custom::LexAlias",
        "DependsOn": "QNAPhoneNumber",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNAPhoneNumber"
            },
            "botVersion": "$LATEST"
        }
    },
    "TimeIntent": {
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNATimeIntent-${AWS::StackName}"},
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
            description: "Parse time responses.",
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
        "Type": "Custom::LexBot",
        "DependsOn": "TimeIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNATimeBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "intents": [
                {"intentName": {"Ref": "TimeIntent"},"intentVersion": "$LATEST"},
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
            },
            "description": "QNATime response bot - " + botDateVersion,
        }
    },
    "TimeAlias": {
        "Type": "Custom::LexAlias",
        "DependsOn": "QNATime",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNATime"
            },
            "botVersion": "$LATEST"
        }
    },
    "EmailAddressIntent": {
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAEmailAddressIntent-${AWS::StackName}"},
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
            description: "Parse email address responses.",
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
        "Type": "Custom::LexBot",
        "DependsOn": "EmailAddressIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAEmailAddressBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "intents": [
                {"intentName": {"Ref": "EmailAddressIntent"},"intentVersion": "$LATEST"},
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
            },
            "description": "QNAEmailAddress response bot - " + botDateVersion,
        }
    },
    "EmailAddressAlias": {
        "Type": "Custom::LexAlias",
        "DependsOn": "QNAEmailAddress",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNAEmailAddress"
            },
            "botVersion": "$LATEST"
        }
    },
    "NameIntent": {
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNANameIntent-${AWS::StackName}"},
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
        "Type": "Custom::LexBot",
        "DependsOn": "NameIntent",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNANameBot-${AWS::StackName}"},
            "locale": "en-US",
            "voiceId": config.voiceId,
            "childDirected": false,
            "intents": [
                {"intentName": {"Ref": "NameIntent"},"intentVersion": "$LATEST"},
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
            },
            "description": "QNAName response bot - " + botDateVersion,
        }
    },
    "NameAlias": {
        "Type": "Custom::LexAlias",
        "DependsOn": "QNAName",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "botName": {
                "Ref": "QNAName"
            },
            "botVersion": "$LATEST"
        }
    }
};


exports.names=[
  "QNAYesNo", "QNADate", "QNADayOfWeek", "QNAMonth", "QNANumber",
  "QNAAge","QNAPhoneNumber", "QNATime", "QNAEmailAddress", "QNAName",
  "QNAWage","QNASocialSecurity","QNAByeCode","QNAPin"
] ;


exports.outputs=_.fromPairs(exports.names.map(x=>{
        return [x,{Value:{"Ref": x}}];
    }));
