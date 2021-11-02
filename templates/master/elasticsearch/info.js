var fs=require('fs')
const path = require('path')
const resplib = path.join(__dirname, '..', '..','lib', 'response.js')
const util = require('../../util');

module.exports={
    "ESInfo":{
        "Type": "Custom::ESProxy",
        "Condition":"DontCreateDomain",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["ESProxyLambda", "Arn"] },
            "name":{"Ref":"ElasticsearchName"}
        }
    },
    "ESInfoLambda": {
      "Type": "AWS::Lambda::Function",
      "Condition":"DontCreateDomain",
      "Properties": {
        "Code": {
            "ZipFile":fs.readFileSync(__dirname+'/handler.js','utf-8')  + fs.readFileSync(resplib,'utf-8')
        },
        "Handler": "index.handler",
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["ESProxyLambdaRole","Arn"]},
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
            Value:"CustomResource"
        }]
      },
      "Metadata": util.cfnNag(["W92"])
    }
}

