var fs=require('fs')
var _=require('lodash')

var examples=require(`./examples`);
var extensions=require(`./extensions`);
var resources=Object.assign(examples,extensions);

module.exports={
  "Resources":resources,
  "Conditions": {},
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "QnABot with admin and client websites",
  "Mappings": {},
  "Outputs": require('./outputs').outputs,
  "Parameters": {
    "FulfillmentLambdaRole":{"Type":"String"},
    "QnAType":{"Type":"String"}, 
    "QuizType":{"Type":"String"},
    "Index":{"Type":"String"},
    "ESAddress":{"Type":"String"},
    "BootstrapBucket":{"Type":"String"},
    "BootstrapPrefix":{"Type":"String"},
    "FeedbackFirehose":{"Type":"String"},
    "FeedbackFirehoseName":{"Type":"String"},
    "CFNLambda":{"Type":"String"},
    "CFNLambdaRole":  {"Type":"String"},
    "ApiUrlName":{"Type":"String"},
    "AssetBucket":{"Type":"String"},
    "QIDLambdaArn":{"Type":"String"}
  },
  "Conditions":{}
}





