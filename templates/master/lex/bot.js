var config=require('./config')

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
        "sampleUtterances": [
            "{slot}"
        ],
        "slots": [{
            "name":"slot",
            "slotType":{"Ref":"SlotType"},
            "slotConstraint":"Optional",
            "slotTypeVersion":"$LATEST"
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
        "locale": "en-US",
        "voiceId": config.voiceId,
        "childDirected": false,
        "intents": [
            {"intentName": {"Ref": "Intent"},"intentVersion": "$LATEST"},
            {"intentName": {"Ref": "IntentFallback"},"intentVersion": "$LATEST"}
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
    "Alias": {
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
        "botVersion": "$LATEST"
      }
    }
}
