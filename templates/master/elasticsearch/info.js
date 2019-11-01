var fs=require('fs')
const resplib = path.join(__dirname, '..', '..','lib', 'response.js')
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
        "Runtime": "nodejs10.x",
        "Timeout": 300,
        "Tags":[{
            Key:"Type",
            Value:"CustomResource"
        }]
      }
    }
}

