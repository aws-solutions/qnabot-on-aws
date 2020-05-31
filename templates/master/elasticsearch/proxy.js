var _=require('lodash')

module.exports={
    "ESCFNProxyLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/proxy-es.zip"},
            "S3ObjectVersion":{"Ref":"ESProxyCodeVersion"}
        },
        "Environment": {
            "Variables": {
                DEFAULT_SETTINGS_PARAM:{"Ref":"DefaultQnABotSettings"},
                CUSTOM_SETTINGS_PARAM:{"Ref":"CustomQnABotSettings"},
            }
        },
        "Handler": "index.resource",
        "MemorySize": "1408",
        "Role": {"Fn::GetAtt": ["ESProxyLambdaRole","Arn"]},
        "Runtime": "nodejs10.x",
        "Timeout": 300,
        "Tags":[{
            Key:"Type",
            Value:"CustomResource"
        }]
      }
    },
    "MetricsIndex":{
        "Type": "Custom::ESProxy",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["ESCFNProxyLambda", "Arn"] },
            "NoUpdate":true,
            "create":{
                endpoint:{"Fn::GetAtt":["ESVar","ESAddress"]},
                path:{"Fn::Sub":"/${ESVar.MetricsIndex}"},
                method:"PUT",
                body:{"Fn::Sub":JSON.stringify({ 
                    settings:{},
                })}
            },
            "delete":{
                endpoint:{"Fn::GetAtt":["ESVar","ESAddress"]},
                path:{"Fn::Sub":"/${ESVar.MetricsIndex}"},
                method:"DELETE"
            }
        }
    },
    "FeedbackIndex":{
        "Type": "Custom::ESProxy",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["ESCFNProxyLambda", "Arn"] },
            "NoUpdate":true,
            "create":{
                endpoint:{"Fn::GetAtt":["ESVar","ESAddress"]},
                path:{"Fn::Sub":"/${ESVar.FeedbackIndex}"},
                method:"PUT",
                body:{"Fn::Sub":JSON.stringify({ 
                    settings:{},
                })}
            },
            "delete":{
                endpoint:{"Fn::GetAtt":["ESVar","ESAddress"]},
                path:{"Fn::Sub":"/${ESVar.FeedbackIndex}"},
                method:"DELETE"
            }
        }
    },
    "Index":{
        "Type": "Custom::ESProxy",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["ESCFNProxyLambda", "Arn"] },
            "NoUpdate":true,
            "create":{
                endpoint:{"Fn::GetAtt":["ESVar","ESAddress"]},
                path:{"Fn::Sub":"/${Var.index}"},
                method:"PUT",
                body:{"Fn::Sub":JSON.stringify({ 
                    settings:require('./index_settings.js'),
                    mappings:require('./index_mappings.js'),
                })}
            },
            "delete":{
                endpoint:{"Fn::GetAtt":["ESVar","ESAddress"]},
                path:{"Fn::Sub":"/${Var.index}"},
                method:"DELETE"
            }
        }
    },
    "KibanaDashboards":{
        "Type": "Custom::ESProxy",
        "DependsOn":["Index"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["ESCFNProxyLambda", "Arn"] },
            "create":{
                endpoint:{"Fn::GetAtt":["ESVar","ESAddress"]},
                path:"/_plugin/kibana/api/kibana/dashboards/import",
                method:"POST",
                headers:{"kbn-xsrf":"kibana"},
                body:require('./kibana/QnABotDashboard'),
            }
        }
    }
}

