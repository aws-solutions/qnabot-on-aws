var config=require('./config')

//must change this version to force upgrades to reapply across the entire Bot echo system
const qnabotversion = process.env.npm_package_version + " - v1";

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
            "{slot}",
            "{actor}",
            "{city}",
            "{country}",
            "{food}",
            "{game}",
            "{music}",
            "{person}",
            "{sport}",
            "{state}",
            "{animal}",
            "{artist}",
            "{movie}",
            "{movieseries}",
            "{tvseries}",
            "{tvepisode}",
            "{atcity}",
            "{atregion}",
            "{decity}",
            "{deregion}",
            "{gbcity}",
            "{gbregion}",
            "{europecity}"
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
            "slotType": "AMAZON.Movie",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "movie"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 11,
            "name": "movie"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.MovieSeries",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "movie series"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 12,
            "name": "movieseries"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.AT_CITY",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "at city"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 13,
            "name": "atcity"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.AT_REGION",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "at region"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 14,
            "name": "atregion"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.DE_CITY",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "de city"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 15,
            "name": "decity"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.DE_REGION",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "de region"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 16,
            "name": "deregion"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.GB_CITY",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "gb city"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 17,
            "name": "gbcity"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.GB_REGION",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "gb region"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 18,
            "name": "gbregion"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.EUROPE_CITY",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "europe city"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 19,
            "name": "europecity"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.Animal",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "animal"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 20,
            "name": "animal"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.Artist",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "artist"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 21,
            "name": "artist"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.TVSeries",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "tv series"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 22,
            "name": "tvseries"
        },
        {
            "sampleUtterances": [],
            "slotType": "AMAZON.TVEpisode",
            "obfuscationSetting": "NONE",
            "slotConstraint": "Optional",
            "valueElicitationPrompt": {
                "messages": [
                    {
                        "contentType": "PlainText",
                        "content": "tv episode"
                    }
                ],
                "maxAttempts": 2
            },
            "priority": 23,
            "name": "tvepisode"
        }
        ],
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
