module.exports={
  "Resources":Object.assign(
    require('./bot'),
    require('./cfn'),
    require('./handler')
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
    "HandlerArn":{
        "Value":{"Fn::GetAtt":["HandlerLambda","Arn"]}
    },
    "HandlerName":{
        "Value":{"Ref":"HandlerLambda"}
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
