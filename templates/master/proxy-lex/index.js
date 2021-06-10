var fs=require('fs')

module.exports={
    "LexProxyLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "ZipFile":fs.readFileSync(__dirname+'/handler.js','utf8')
        },
        "Handler": "index.handler",
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["LexProxyLambdaRole","Arn"]},
        "Runtime": "nodejs12.x",
        "Timeout": 300,
        "VpcConfig" : {
            "Fn::If": [ "VPCEnabled", {
                "SubnetIds": {"Ref": "VPCSubnetIdList"},
                "SecurityGroupIds": {"Ref": "VPCSecurityGroupIdList"}
            }, {"Ref" : "AWS::NoValue"} ]
        },
        "TracingConfig" : {
            "Fn::If": [ "XRAYEnabled", {"Mode": "Active"},
                {"Ref" : "AWS::NoValue"} ]
        },
        "Tags":[{
            Key:"Type",
            Value:"Api"
        }]
      }
    },
    "LexStatusLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "ZipFile":fs.readFileSync(__dirname+'/status.js','utf8')
        },
        "Environment": {
            "Variables":{
                STATUS_BUCKET:{"Ref":"BuildStatusBucket"},
                STATUS_KEY:{"Fn::If": ["CreateLexV1Bots", "status.json", {"Ref":"AWS::NoValue"}]},
                LEXV2_STATUS_KEY:"lexV2status.json",
                FULFILLMENT_FUNCTION_ARN: {"Fn::GetAtt": ["FulfillmentLambda", "Arn"]},
                FULFILLMENT_FUNCTION_ROLE: {"Ref": "FulfillmentLambdaRole"},
                LEXV1_BOT_NAME: {"Fn::If": ["CreateLexV1Bots",{"Ref": "LexBot"},{"Ref": "AWS::NoValue"}]},
                LEXV1_INTENT: {"Fn::If": ["CreateLexV1Bots",{"Ref": "Intent"},{"Ref": "AWS::NoValue"}]},
                LEXV1_INTENT_FALLBACK: {"Fn::If": ["CreateLexV1Bots",{"Ref": "IntentFallback"},{"Ref": "AWS::NoValue"}]},
                LEXV2_BOT_NAME: {"Fn::GetAtt": ["LexV2Bot", "botName"]},
                LEXV2_BOT_ID: {"Fn::GetAtt": ["LexV2Bot", "botId"]},
                LEXV2_BOT_ALIAS: {"Fn::GetAtt": ["LexV2Bot", "botAlias"]},
                LEXV2_BOT_ALIAS_ID: {"Fn::GetAtt": ["LexV2Bot", "botAliasId"]},
                LEXV2_INTENT: {"Fn::GetAtt": ["LexV2Bot", "botIntent"]},
                LEXV2_INTENT_FALLBACK: {"Fn::GetAtt": ["LexV2Bot", "botIntentFallback"]},
                LEXV2_BOT_LOCALE_IDS: {"Fn::GetAtt": ["LexV2Bot", "botLocaleIds"]}
            }
        },
        "Handler": "index.handler",
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["LexProxyLambdaRole","Arn"]},
        "Runtime": "nodejs12.x",
        "Timeout": 300,
        "VpcConfig" : {
            "Fn::If": [ "VPCEnabled", {
                "SubnetIds": {"Ref": "VPCSubnetIdList"},
                "SecurityGroupIds": {"Ref": "VPCSecurityGroupIdList"}
            }, {"Ref" : "AWS::NoValue"} ]
        },
        "TracingConfig" : {
            "Fn::If": [ "XRAYEnabled", {"Mode": "Active"},
                {"Ref" : "AWS::NoValue"} ]
        },
        "Tags":[{
            Key:"Type",
            Value:"Api"
        }]
      }
    },
    "LexProxyLambdaRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Path": "/",
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
          "arn:aws:iam::aws:policy/AmazonLexFullAccess",
          "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
        ],
        "Policies":[{
            "PolicyName":"Access",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "s3:Get*"
                    ],
                    "Resource":[{"Fn::Sub":"arn:aws:s3:::${BuildStatusBucket}*"}]
              }]
            }
        }]
      }
    }
}

