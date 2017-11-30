var config=require('./config')

module.exports={
    "QNAInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "Action": "lambda:InvokeFunction",
        "FunctionName": {"Fn::GetAtt":["HandlerLambda","Arn"]},
        "Principal": "lex.amazonaws.com"
      }
    },
    "QNASlot":{
        "Type": "Custom::LexSlotType",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "enumerationValues": config.utterances.map(x=>{return {value:x}})
        }
    },
    "QNAIntent": {
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
            "slotType":{"Ref":"QNASlot"},
            "slotConstraint":"Optional",
            "slotTypeVersion":"$LATEST"
        }],
        "fulfillmentActivity": {
          "type": "CodeHook",
          "codeHook": {
            "uri": {"Fn::GetAtt":["HandlerLambda","Arn"]},
            "messageVersion": "1.0"
          }
        }
      },
      "DependsOn": "QNAInvokePermission"
    },
    "Bot": {
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
            {"intentName": {"Ref": "QNAIntent"},"intentVersion": "$LATEST"}
        ],
        "clarificationPrompt": {
          "maxAttempts": 5,
          "messages": [
            {
              "content": config.Clarification,
              "contentType": "PlainText"
            }
          ]
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
    "Alias": {
      "Type": "Custom::LexAlias",
      "Properties": {
        "ServiceToken": {
          "Fn::GetAtt": [
            "CFNLambda",
            "Arn"
          ]
        },
        "botName": {
          "Ref": "Bot"
        },
        "botVersion": "$LATEST"
      },
      "DependsOn": "Bot"
    }
}
