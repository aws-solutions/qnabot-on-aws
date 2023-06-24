// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const examples=require(`./examples`);
const extensions=require(`./extensions`);
const exampleOutputs=require('./outputs').outputs;
const responsebotOutputs=require('./examples/responsebots-lexv2').outputs;
const outputSNSTopic={"FeedbackSNSTopic":{"Value":{"Fn::GetAtt":["FeedbackSNS","TopicName"]}}};

/*
 SSM param to capture mappings:  
 - example lambda function aliases to fucntion names, and 
 - response bot aliases to BotId/BotAliasId/lang
Used by Fulfillment handler function (in parse.js) to set environments valiables
later referenced when invoking lambda hooks, or responsebots
*/
const aliases=Object.assign(exampleOutputs,responsebotOutputs);
const aliasKeyValues=Object.entries(aliases).reduce((acc, [key, value]) => ({ ...acc, [key]: value.Value }), {});
const aliasSettings = {
  "AliasSettings": {
    "Type": "AWS::SSM::Parameter",
    "Properties": {
      "Description": "Settings for example lambda and responsebot aliases",
      "Type": "String",
      "Tier": "Advanced",  // Advanced tier required to accomodate number of settings
      "Value": { "Fn::Sub" : [ 
        JSON.stringify(
          Object.fromEntries(Object.entries(aliasKeyValues).map(([key, value]) => [key, `\${${key}}`]))
        ),
        aliasKeyValues
      ]}
    }
  },
  "AliasSettingsPolicy": {
    "Type": "AWS::IAM::ManagedPolicy",
    "Properties": {
      "PolicyDocument": {
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "ssm:GetParameter",
            "ssm:GetParameters"
          ],
          "Resource": {
            "Fn::Join": [
              "", [
                "arn:aws:ssm:",
                { "Fn::Sub": "${AWS::Region}:" },
                { "Fn::Sub": "${AWS::AccountId}:" },
                "parameter/",
                { "Ref": "AliasSettings" }
              ]
            ]
          }
        }]
      },
      "Roles": [{"Ref": "FulfillmentLambdaRole"}]
    }
  }
}
const outputAliasSettings={"AliasSettings":{"Value":{"Ref":"AliasSettings"}}};

const resources=Object.assign(examples,extensions, aliasSettings);
const outputs=Object.assign(exampleOutputs,responsebotOutputs,outputSNSTopic,outputAliasSettings);


module.exports={
  "Resources":resources,
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "(SO0189n-example) QnABot nested example resources",
  "Mappings": {},
  "Outputs": outputs,
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
    "QIDLambdaArn":{"Type":"String"},
    "VPCSubnetIdList" : {"Type": "String"},
    "VPCSecurityGroupIdList": {"Type": "String"},
    "LexBotVersion": {"Type": "String"},
    "XraySetting": {"Type": "String"},
    "DefaultQnABotSettings": {"Type":"String"},
    "InstallLexResponseBots": {"Type":"String"},
  },
   "Conditions": {
    "VPCEnabled": { "Fn::Not": [
        { "Fn::Equals": [ "", { "Ref": "VPCSecurityGroupIdList" } ] }
      ] },
    "XRAYEnabled":{"Fn::Equals":[{"Ref":"XraySetting"},"TRUE"]},
    "CreateLexV1Bots":{"Fn::Equals":[{"Ref":"LexBotVersion"},"LexV1 and LexV2"]},
    "CreateLexResponseBots":{"Fn::Equals":[{"Ref":"InstallLexResponseBots"},"true"]},
    "CreateLexV1ResponseBots":{"Fn::And":[{"Condition":"CreateLexResponseBots"}, {"Condition":"CreateLexV1Bots"}]},
    }
  }