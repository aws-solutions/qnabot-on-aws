var fs=require('fs')

module.exports={
    "VersionLambda":{
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "ZipFile":fs.readFileSync(__dirname+'/handler.js','utf-8')
        },
        "Handler": "index.handler",
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["CFNLambdaRole","Arn"]},
        "Runtime": "nodejs6.10",
        "Timeout": 60,
        "Tags":[{
            Key:"Type",
            Value:"CustomResource"
        }]
      }
    },
    "CFNVersion":{
        "Type": "Custom::S3Version",
        "DependsOn":["CFNLambdaPolicy"],
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
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["CFNLambdaRole","Arn"]},
        "Runtime": "nodejs6.10",
        "Timeout": 60,
        "Tags":[{
            Key:"Type",
            Value:"CustomResource"
        }]
      }
    },
    
}
