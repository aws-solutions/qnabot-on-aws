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
        "Handler": "index.resource",
        "MemorySize": "1408",
        "Role": {"Fn::GetAtt": ["ESProxyLambdaRole","Arn"]},
        "Runtime": "nodejs8.10",
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
                    settings: {
                        analysis: {
                          filter: {
                            english_stop: {
                              type:       "stop",
                              stopwords:  ["a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in", "into", "is", "it",
                                            "not", "of", "on", "or", "such", "that", "the", "their", "then", "there", "these",
                                            "they", "this", "to", "was", "will", "with"
                                          ]  
                            },
                            english_keywords: {
                              type:       "keyword_marker",
                              keywords:   ["example"] 
                            },
                            english_stemmer: {
                              type:       "stemmer",
                              language:   "english"
                            },
                            english_possessive_stemmer: {
                              type:       "stemmer",
                              language:   "possessive_english"
                            }
                          },
                          analyzer: {
                            custom_english: {
                              type: "custom",    
                              tokenizer:  "standard",
                              filter: [
                                "english_possessive_stemmer",
                                "lowercase",
                                "english_stop",
                                "english_keywords",
                                "english_stemmer"
                              ]
                            }
                          }
                        }
                    },
                    mappings:{
                        "${Var.QnAType}":require('./schema/qna'),
                        "${Var.QuizType}":require('./schema/quiz')
                    }
                })}
            },
            "delete":{
                endpoint:{"Fn::GetAtt":["ESVar","ESAddress"]},
                path:{"Fn::Sub":"/${Var.index}"},
                method:"DELETE"
            }
        }
    },
    "Kibana":{
        "Type": "Custom::Kibana",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "address":{"Fn::GetAtt":["ESVar","ESAddress"]}
        }
    },
    "KibanaConfig":{
        "Type": "Custom::ESProxy",
        "DependsOn":["Kibana"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["ESCFNProxyLambda", "Arn"] },
            "create":{
                endpoint:{"Fn::GetAtt":["ESVar","ESAddress"]},
                path:{"Fn::Sub":"_bulk"},
                method:"POST",
                body:_.flatten(_.flatten([
                    require('./kibana/config'),
                    require('./kibana/Dashboards')
                ]).map(x=>[
                    {"index":{"_index":x._index,"_type":x._type,"_id":x._id}},
                    x._source
                ]))
            }
        }
    }
}

