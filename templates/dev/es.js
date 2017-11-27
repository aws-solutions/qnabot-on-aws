module.exports={
   "Description": "This template creates dev ElasticSearch Cluster",
   "Resources":Object.assign({
    "EsInit":{
        "Type": "Custom::EsInit",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Address":{"Fn::ImportValue":"QNA-DEV-ES-ADDRESS"},
            "Index":"test-index",
            "Type":"test-type"
        }
    }},require('./cfn')
    ),
   "Outputs": {
        "Type":{
            "Value":"test-type",
            "Export":{
                "Name":"QNA-DEV-TYPE"
            }
        },
        "Index":{
            "Value":"test-index",
            "Export":{
                "Name":"QNA-DEV-INDEX"
            }
        }
   }
}
