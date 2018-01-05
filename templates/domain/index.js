module.exports={
    "Description": "This template creates ElasticSearch Cluster\n",
    "Resources":Object.assign(
        require('./cfn'),
        require('./es'),
        require('./var'),
        require('./proxy')
    ),
    "Parameters":{
        "BootstrapBucket":{
            "Type":"String"
        },
        "BootstrapPrefix":{
            "Type":"String"
        },
        "ElasticSearchArn":{
            "Type":"String",
            "Default":"EMPTY"
        },
        "ElasticSearchAddress":{
            "Type":"String",
            "Default":"EMPTY"
        },
        "ElasticSearchName":{
            "Type":"String",
            "Default":"EMPTY"
        }
    },
    "Outputs": {
        "ESArn": {
            "Value":{"Fn::GetAtt":["ESVar","ESArn"]}
        },
        "ESAddress": {
            "Value":{"Fn::GetAtt":["ESVar","ESAddress"]}
        },
        "ESDomain": {
            "Value":{"Fn::GetAtt":["ESVar","ESDomain"]}
        },
        "Index":{
            "Value":{"Fn::GetAtt":["Var","index"]}
        },
        "Type":{
            "Value":{"Fn::GetAtt":["Var","type"]}
        }
    },
    "Conditions":{
        "CreateDomain":{"Fn::Equals":[{"Ref":"ElasticSearchArn"},"EMPTY"]},
    }
}
