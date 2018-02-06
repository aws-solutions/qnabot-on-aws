var fs=require('fs')
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
            "ZipFile":fs.readFileSync(__dirname+'/handler.js','utf-8')
        },
        "Handler": "index.handler",
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["ESProxyLambdaRole","Arn"]},
        "Runtime": "nodejs6.10",
        "Timeout": 300
      }
    }
}

