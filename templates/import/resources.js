const util = require('../util');

module.exports=Object.assign(
    require('./bucket'),{
    "ImportCodeVersion":{
        "Type": "Custom::S3Version",
        "Properties": {
            "ServiceToken": { "Ref" : "CFNLambda" },
            "Bucket": {"Ref":"BootstrapBucket"},
            "Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/import.zip"},
            "BuildDate":(new Date()).toISOString()
        }
    },
    "ImportStartLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/import.zip"},
            "S3ObjectVersion":{"Ref":"ImportCodeVersion"}
        },
        "Environment": {
            "Variables": {
                STRIDE:"1000000",
                ES_INDEX:{"Ref":"VarIndex"},
                ES_METRICSINDEX:{"Ref":"MetricsIndex"},
                ES_FEEDBACKINDEX:{"Ref":"FeedbackIndex"},
                ES_ENDPOINT:{"Ref":"EsEndpoint"},
                ES_PROXY:{"Ref":"EsProxyLambda"}
            }
        },
        "Handler": "index.start",
        "MemorySize": "1024",
        "Role": {"Fn::GetAtt": ["ImportRole","Arn"]},
        "Runtime": "nodejs12.x",
        "Timeout": 300,
        "VpcConfig" : {
            "Fn::If": [ "VPCEnabled", {
                "SubnetIds": { "Fn::Split" : [ ",", {"Ref": "VPCSubnetIdList"} ] },
                "SecurityGroupIds": { "Fn::Split" : [ ",", {"Ref": "VPCSecurityGroupIdList"} ] },
            }, {"Ref" : "AWS::NoValue"} ]
        },
        "TracingConfig" : {
            "Fn::If": [ "XRAYEnabled", {"Mode": "Active"},
                {"Ref" : "AWS::NoValue"} ]
        },
        "Tags":[{
            Key:"Type",
            Value:"Import"
        }]
      }
    },
    "ImportStepLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/import.zip"},
            "S3ObjectVersion":{"Ref":"ImportCodeVersion"}
        },
        "Environment": {
            "Variables": {
                ES_INDEX:{"Ref":"VarIndex"},
                ES_METRICSINDEX:{"Ref":"MetricsIndex"},
                ES_FEEDBACKINDEX:{"Ref":"FeedbackIndex"},
                ES_ENDPOINT:{"Ref":"EsEndpoint"},
                ES_PROXY:{"Ref":"EsProxyLambda"}
            }
        },
        "Handler": "index.step",
        "MemorySize": "1024",
        "Role": {"Fn::GetAtt": ["ImportRole","Arn"]},
        "Runtime": "nodejs12.x",
        "Timeout": 300,
        "VpcConfig" : {
            "Fn::If": [ "VPCEnabled", {
                "SubnetIds": { "Fn::Split" : [ ",", {"Ref": "VPCSubnetIdList"} ] },
                "SecurityGroupIds": { "Fn::Split" : [ ",", {"Ref": "VPCSecurityGroupIdList"} ] },
            }, {"Ref" : "AWS::NoValue"} ]
        },
        "TracingConfig" : {
            "Fn::If": [ "XRAYEnabled", {"Mode": "Active"},
                {"Ref" : "AWS::NoValue"} ]
        },
        "Tags":[{
            Key:"Type",
            Value:"Import"
        }]
      }
    },
    "ImportRole": {
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
        "Policies": [
          util.basicLambdaExecutionPolicy(),
          util.lambdaVPCAccessExecutionRole(),
          util.xrayDaemonWriteAccess(),
        ],
        "ManagedPolicyArns": [
          {"Ref":"ImportPolicy"}
        ]
      },
      "Metadata": util.cfnNagXray()
    },
    "ImportPolicy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [{
              "Effect": "Allow",
              "Action": [
                "s3:*"
              ],
              "Resource":[{"Fn::Sub":"arn:aws:s3:::${ImportBucket}*"}]
          },{
              "Effect": "Allow",
              "Action": [
                "lambda:InvokeFunction"
              ],
              "Resource":[{"Ref":"EsProxyLambda"}]
          }]
        }
      }
    },
    "ImportClear":{
        "Type": "Custom::S3Clear",
        "Properties": {
            "ServiceToken": { "Ref" : "CFNLambda" },
            "Bucket":{"Ref":"ImportBucket"}
        }
    }
})

