module.exports={
"Var":{
    "Type": "Custom::Variable",
    "Properties": {
        "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
        "index":{
            value:{"Ref":"AWS::StackName"},
            op:"toLowerCase"
        },
        "type":{
            value:{"Ref":"AWS::StackName"},
            op:"toLowerCase"
        }
    }
},
"ESVar":{
    "Type": "Custom::Variable",
    "Properties": {
        "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
        "ESArn": {"Fn::If":[
            "CreateDomain",
            {"Fn::GetAtt":["ElasticsearchDomain","DomainArn"]},
            {"Fn::GetAtt":["ESInfo","Arn"]}
        ]},
        "ESAddress":{"Fn::If":[
            "CreateDomain",
            {"Fn::GetAtt":["ElasticsearchDomain","DomainEndpoint"]},
            {"Fn::GetAtt":["ESInfo","Endpoint"]}
        ]},
        "ESDomain":{"Fn::If":[
            "CreateDomain",
            {"Ref":"ElasticsearchDomain"},
            {"Ref":"ElasticsearchName"}
        ]}
    }
},
"ApiUrl":{
    "Type": "Custom::Variable",
    "Properties": {
        "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
        "Name":{"Fn::Join": ["",[
            "https://",
            {"Ref": "API"},
            ".execute-api.",
            {"Ref": "AWS::Region"},
            ".amazonaws.com/prod"
        ]]}
    }
},
"Urls":{
    "Type": "Custom::Variable",
    "Properties": {
        "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
        "Designer":{"Fn::Join": ["",[
            {"Fn::GetAtt":["ApiUrl","Name"]},
            "/static/index.html"
        ]]},
        "Client":{"Fn::Join": ["",[
            {"Fn::GetAtt":["ApiUrl","Name"]},
            "/static/client.html"
        ]]}
    }
}
}
