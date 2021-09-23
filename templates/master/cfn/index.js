var fs=require('fs')
const path = require('path')
const resplib = path.join(__dirname, '..', '..','lib', 'response.js')
const util = require('../../util');
console.log(resplib)
module.exports={
    "VersionLambda":{
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "ZipFile":fs.readFileSync(__dirname+'/handler.js','utf-8' ) + fs.readFileSync(resplib,'utf-8')
        },
        "Handler": "index.handler",
        "MemorySize": "3008",
        "Role": {"Fn::GetAtt": ["CFNLambdaRole","Arn"]},
        "Runtime": "nodejs12.x",
        "Timeout": 60,
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
            Value:"CustomResource"
        }]
      },
      "Metadata": util.cfnNag(["W92"])
    },
    "CFNVersion":{
        "Type": "Custom::S3Version",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["VersionLambda", "Arn"] },
            "Bucket": {"Ref":"BootstrapBucket"},
            "Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/cfn.zip"},
            "BuildDate":(new Date()).toISOString()
        }
    },
    "CFNLambda":{
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Join":["",[
                {"Ref":"BootstrapPrefix"},
                "/lambda/cfn.zip"
            ]]},
            "S3ObjectVersion":{"Fn::GetAtt":["CFNVersion","version"]}
        },
        "Handler": "index.handler",
        "MemorySize": "3008",
        "Role": {"Fn::GetAtt": ["CFNLambdaRole","Arn"]},
        "Runtime": "nodejs12.x",
        "Timeout": 180,
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
            Value:"CustomResource"
        }]
      },
      "Metadata": util.cfnNag(["W92"])
    },
    "CFNInvokePolicy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [{
              "Effect": "Allow",
              "Action": [
                "lambda:InvokeFunction"
              ],
              "Resource":[
                {"Fn::GetAtt":["CFNLambda","Arn"]},
              ]
            }]
        },
        "Roles": [{"Ref": "CFNLambdaRole"}]
      }
    }
}
