module.exports={
  "Resources":Object.assign(
    require('./bot'),
    require('./cfn'),
    require('./fulfillment')
  ), 
  "Conditions": {},
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "creates Lex QnABot",
  "Mappings": {},
  "Outputs": {
    "BotConsoleUrl":{
      "Value":{"Fn::Join":["",[
        "https://console.aws.amazon.com/lex/home?",
        "region=",{"Ref":"AWS::Region"},
        "#bot-editor:bot=",{"Ref":"Bot"}
      ]]}
    },
    "Bot": {
      "Value": {
        "Ref": "Bot"
      }
    },
    "BotAlias": {
      "Value": {
        "Ref": "Alias"
      }
    },
    "Intent": {
      "Value": {
        "Ref": "QNAIntent"
      }
    },
    "SlotType":{
        "Value":{"Ref":"QNASlot"}
    },
    "FulfillmentArn":{
        "Value":{"Fn::GetAtt":["FulfillmentLambda","Arn"]}
    },
    "FulfillmentName":{
        "Value":{"Ref":"FulfillmentLambda"}
    }
  }, 
  "Parameters": {
    "BootstrapBucket":{
      "Type":"String"
    },
    "BootstrapPrefix":{
      "Type":"String"
    },
    "Address": {
      "Type": "String"
    },
    "DomainArn": {
      "Type": "String"
    },
    "Index": {
      "Type": "String"
    },
    "Type": {
      "Type": "String"
    },
    "ErrorMessage":{
      "Type":"String"
    },
    "EmptyMessage":{
      "Type":"String"
    }
  }
}
