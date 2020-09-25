var config=require('./config')

//must change this version to force upgrades to reapply across the entire Bot echo system
const qnabotversion = process.env.npm_package_version + " - v3";

module.exports={
    "QNAInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "Action": "lambda:InvokeFunction",
        "FunctionName": {"Fn::GetAtt":["FulfillmentLambda","Arn"]},
        "Principal": "lex.amazonaws.com"
      }
    },
    "SlotType":{
        "Type": "Custom::LexSlotType",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "createVersion" : true,
            "description": "custom slot type " + qnabotversion,
            "enumerationValues": config.utterances.map(x=>{return {value:x}})
        }
    },
    "Intent": {
      "Type": "Custom::LexIntent",
      "Properties": {
        "ServiceToken": {
          "Fn::GetAtt": ["CFNLambda","Arn"]
        },
        "prefix":"fulfilment",
        "description": "custom intent " + qnabotversion,
        "createVersion" : true,
        "sampleUtterances": [
            "{slot}"
        ],
        "slots": [{
            "name":"slot",
            "slotType":{"Ref":"SlotType"},
            "slotConstraint":"Optional",
            "slotTypeVersion":"QNABOT-AUTO-ASSIGNED",
            "priority": 1,
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.Actor",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "actor"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 5,
            "name": "actor"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.US_CITY",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "city"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 3,
            "name": "city"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.Country",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "country"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 2,
            "name": "country"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.Food",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "food"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 7,
            "name": "food"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.Game",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "game"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 10,
            "name": "game"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.MusicRecording",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "music"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 6,
            "name": "music"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.Person",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "person"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 9,
            "name": "person"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.MusicRecording",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "recording"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 11,
            "name": "recording"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.Sport",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "sport"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 8,
            "name": "sport"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.US_STATE",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "state"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 4,
            "name": "state"
        }],
        "fulfillmentActivity": {
          "type": "CodeHook",
          "codeHook": {
            "uri": {"Fn::GetAtt":["FulfillmentLambda","Arn"]},
            "messageVersion": "1.0"
          }
        }
      },
      "DependsOn": "QNAInvokePermission"
    },
    "IntentFallback": {
        "Type": "Custom::LexIntent",
        "Properties": {
            "ServiceToken": {
                "Fn::GetAtt": ["CFNLambda","Arn"]
            },
            "prefix":"qnabotfallbackfulfilment",
            "description": "custom fallback intent " + qnabotversion,
            "createVersion" : true,
            "fulfillmentActivity": {
                "type": "CodeHook",
                "codeHook": {
                    "uri": {"Fn::GetAtt":["FulfillmentLambda","Arn"]},
                    "messageVersion": "1.0"
                }
            },
            "parentIntentSignature": "AMAZON.FallbackIntent"
        },
        "DependsOn": "QNAInvokePermission"
    },
    "LexBot": {
      "Type": "Custom::LexBot",
      "Properties": {
        "ServiceToken": {
          "Fn::GetAtt": [
            "CFNLambda",
            "Arn"
          ]
        },
        "name":{"Fn::Sub":"${AWS::StackName}-Bot"},
        "description": "QnABot primary bot " + qnabotversion,
        "locale": "en-US",
        "voiceId": config.voiceId,
        "childDirected": false,
        "createVersion": true,
          "intents": [
            {"intentName": {"Ref": "Intent"}},
            {"intentName": {"Ref": "IntentFallback"}}
        ],
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
    "VersionAlias": {
      "Type": "Custom::LexAlias",
      "DependsOn": "LexBot",
      "Properties": {
        "ServiceToken": {
          "Fn::GetAtt": [
            "CFNLambda",
            "Arn"
          ]
        },
        "botName": {
          "Ref": "LexBot"
        },
        "name": "live",
        "description": "QnABot live alias " + qnabotversion
      }
    }
}
