module.exports={
"Var":{
    "Type": "Custom::Variable",
    "Properties": {
        "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
        "index":"qna",
        "type":"qna"
    }
},
"ESVar":{
    "Type": "Custom::Variable",
    "Properties": {
        "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
        "ESArn": {"Fn::If":[
            "CreateDomain",
            {"Fn::GetAtt":["ElasticsearchDomain","DomainArn"]},
            {"Ref":"ElasticSearchArn"}
        ]},
        "ESAddress":{"Fn::If":[
            "CreateDomain",
            {"Fn::GetAtt":["ElasticsearchDomain","DomainEndpoint"]},
            {"Ref":"ElasticSearchAddress"}
        ]},
        "ESDomain":{"Fn::If":[
            "CreateDomain",
            {"Ref":"ElasticsearchDomain"},
            {"Ref":"ElasticSearchName"}
        ]}
    }
}
}
