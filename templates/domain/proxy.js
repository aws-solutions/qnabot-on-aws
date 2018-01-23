module.exports={
    "ESProxyCodeVersion":{
        "Type": "Custom::S3Version",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket": {"Ref":"BootstrapBucket"},
            "Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/proxy-es.zip"},
            "BuildDate":(new Date()).toISOString()
        }
    },
    "ESProxyLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/proxy-es.zip"},
            "S3ObjectVersion":{"Ref":"ESProxyCodeVersion"}
        },
        "Handler": "index.resource",
        "MemorySize": "256",
        "Role": {"Fn::GetAtt": ["Role","Arn"]},
        "Runtime": "nodejs6.10",
        "Timeout": 300
      }
    },
    "Index":{
        "Type": "Custom::ESProxy",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["ESProxyLambda", "Arn"] },
            "create":{
                endpoint:{"Fn::GetAtt":["ESVar","ESAddress"]},
                path:{"Fn::Sub":"/${Var.index}"},
                method:"PUT",
                body:{
                    settings:{}
                }
            },
            "delete":{
                endpoint:{"Fn::GetAtt":["ESVar","ESAddress"]},
                path:{"Fn::Sub":"/${Var.index}"},
                method:"DELETE"
            }
        }
    },
    "Type":{
        "Type": "Custom::ESProxy",
        "DependsOn":["Index"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["ESProxyLambda", "Arn"] },
            "create":{
                endpoint:{"Fn::GetAtt":["ESVar","ESAddress"]},
                path:{"Fn::Sub":"/${Var.index}/_mapping/${Var.type}"},
                method:"PUT",
                body:JSON.stringify(require('./schema'))
            }
        }
    }
}

