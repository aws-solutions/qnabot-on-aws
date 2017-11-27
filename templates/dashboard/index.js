var fs=require('fs')
module.exports={
  "Resources":{
    "dashboard":{
        "Type" : "AWS::CloudWatch::Dashboard",
        "Properties" : {
            "DashboardName" : {"Ref":"Name"},
            "DashboardBody" : JSON.stringify(require('./body'))
        }
    }
  },
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Creates a Cloudwatch Dashboard",
  "Mappings": {},
  "Outputs": {
    "name":{
        "Value":{"Ref":"dashboard"}
    }
  },
  "Parameters": {
    "Name":{"Type":"String"},
    "APIGateWay":{"Type":"String"},
    "ESDomain":{"Type":"String"},
    "BotName":{"Type":"String"},
    "HandlerLambda":{"Type":"String"}
  }
}





