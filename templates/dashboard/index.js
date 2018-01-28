var fs=require('fs')
module.exports={
  "Resources":{
    "dashboard":{
        "Type" : "AWS::CloudWatch::Dashboard",
        "Properties" : {
            "DashboardName" : {"Ref":"Name"},
            "DashboardBody" : {"Fn::Sub":JSON.stringify(require('./body'))}
        }
    }
  },
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Creates a Cloudwatch Dashboard",
  "Mappings": {},
  "Outputs": {
    "Url":{
        "Value":{"Fn::Join":["",[
            "https://console.aws.amazon.com/cloudwatch/home?",
            "region=",{"Ref":"AWS::Region"},
            "#dashboards:name=",{"Ref":"dashboard"}
        ]]}
    }
  },
  "Parameters": {
    "Name":{"Type":"String"},
    "APIGateWay":{"Type":"String"},
    "ESDomain":{"Type":"String"},
    "BotName":{"Type":"String"},
    "FulfillmentLambda":{"Type":"String"},
    "BootstrapBucket":{"Type":"String"},
    "BootstrapPrefix":{"Type":"String"}
  }
}





