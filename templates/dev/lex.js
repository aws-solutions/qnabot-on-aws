module.exports={
   "Description": "This template creates dev ElasticSearch Cluster",
   "Resources": Object.assign(require('./cfn'),{
     "Bot":{
        "Type": "Custom::LexBot",
        "Properties": {
            "ServiceToken":{ "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "locale": "en-US",
            "voiceId":"Joanna",
            "childDirected":  false,
            "intents":[{
                "intentName":{"Ref":"Intent"},
                "intentVersion":"$LATEST"
            }],
            "clarificationPrompt": {
                "maxAttempts": 1,
                "messages": [{
                    "content": "Who?",
                    "contentType": "PlainText" 
                }]
            },
            "abortStatement":{
                "messages": [{
                    "content": "GoodBye", 
                    "contentType": "PlainText"
                }]
            }
        }
    },
    "SlotType":{
        "Type": "Custom::LexSlotType",
        "Properties": {
            "ServiceToken":{ "Fn::GetAtt" : ["CFNLambda", "Arn"] } ,
            "enumerationValues": [{"value": "how bad is second hand smoke"}]
        }
    },
    "Intent":{
      "Type": "Custom::LexIntent",
      "Properties": {
        "ServiceToken":{ "Fn::GetAtt" : ["CFNLambda", "Arn"] },
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
        "fulfillmentActivity":{
            "type":"ReturnIntent"
        }
      }
    }
   }),
   "Outputs": {
        "SlotType":{
            "Value":{"Ref":"SlotType"},
            "Export":{
                "Name":"QNA-DEV-SLOTTYPE"
            }
        },
        "Intent":{
            "Value":{"Ref":"Intent"},
            "Export":{
                "Name":"QNA-DEV-INTENT"
            }
        },
        "Bot":{
            "Value":{"Ref":"Bot"},
            "Export":{
                "Name":"QNA-DEV-BOT"
            }
        }       
   }
}
