module.exports={
    "ESCFNProxyLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/proxy-es.zip"},
            "S3ObjectVersion":{"Ref":"ESProxyCodeVersion"}
        },
        "Handler": "index.resource",
        "MemorySize": "1408",
        "Role": {"Fn::GetAtt": ["ESProxyLambdaRole","Arn"]},
        "Runtime": "nodejs6.10",
        "Timeout": 300
      }
    },
    "Index":{
        "Type": "Custom::ESProxy",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["ESCFNProxyLambda", "Arn"] },
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
            "ServiceToken": { "Fn::GetAtt" : ["ESCFNProxyLambda", "Arn"] },
            "create":{
                endpoint:{"Fn::GetAtt":["ESVar","ESAddress"]},
                path:{"Fn::Sub":"/${Var.index}/_mapping/${Var.type}"},
                method:"PUT",
                body:JSON.stringify(require('./schema'))
            }
        }
    }
}

