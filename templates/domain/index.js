module.exports={
    "Description": "This template creates ElasticSearch Cluster\n",
    "Resources":Object.assign(
        require('./cfn'),
        require('./es')
    ),
    "Parameters":{
        "BootstrapBucket":{
            "Type":"String"
        },
        "BootstrapPrefix":{
            "Type":"String"
        }
    },
    "Outputs": {
        "ESArn": {
            "Value": {"Fn::GetAtt":["ElasticsearchDomain","DomainArn"]}
        },
        "ESAddress": {
            "Value": {"Fn::GetAtt":["ElasticsearchDomain","DomainEndpoint"]}
        },
        "ESDomain": {
            "Value": {"Ref":"ElasticsearchDomain"}
        },
        "Index":{
            "Value":{"Fn::GetAtt":["EsInit","Index"]}
        },
        "Type":{
            "Value":{"Fn::GetAtt":["EsInit","Type"]}
        }
    }
}
