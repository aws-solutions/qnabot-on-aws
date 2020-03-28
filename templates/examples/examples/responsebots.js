var _ = require('lodash');

var config={
    "voiceId":"Joanna",
    "Clarification":"Sorry, can you please repeat that?",
    "Abort":"Sorry, I could not understand.",
    "utterances":require('../../../assets/default-utterances')
};

exports.resources={
    // Yes_No ResponseBot
    "YesNoSlotType":{
        "Type": "Custom::LexSlotType",
        "Properties": {
            "ServiceToken": {"Ref": "CFNLambda"},
            "name":{"Fn::Sub":"QNAYesNoSlotType-${AWS::StackName}"},
            "enumerationValues": [
                {"value":"Yes", "synonyms":["OK","Yeah","Sure","Yep","Affirmative","Si","Oui"]},
                {"value":"No", "synonyms":["Nope","Na","Negative","Non"]},
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
              "content": config.Clarification
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
        }
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
    }
};


exports.names=[
  "QNAYesNo"
] ;


exports.outputs=_.fromPairs(exports.names.map(x=>{
        return [x,{Value:{"Ref": x}}];
    }));
