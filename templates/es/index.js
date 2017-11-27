module.exports={
  "Resources": Object.assign({
    "EsInit":{
        "Type": "Custom::EsInit",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Address":{"Ref":"Address"},
            "Index":"qna-index",
            "Type":"qna"
        }
    }},
    require('./cfn')),
  "Conditions": {},
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Initializes index and type in ElasticSearch Domain",
  "Mappings": {},
  "Outputs": {
    "Index":{
        "Value":{"Fn::GetAtt":["EsInit","Index"]}
    },
    "Type":{
        "Value":{"Fn::GetAtt":["EsInit","Type"]}
    }
  },
  "Parameters": {
    "BootstrapBucket":{
        "Type":"String"
    },
    "BootstrapPrefix":{
        "Type":"String"
    },
    "Arn":{
        "Type":"String"
    },
    "Address":{
        "Type":"String"
    }
  }
}
