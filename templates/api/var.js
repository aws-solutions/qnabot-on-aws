module.exports={
"ApiUrl":{
    "Type": "Custom::Variable",
    "Properties": {
        "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
        "Name":{"Fn::Join": ["",[
            "https://",
            {"Ref": "API"},
            ".execute-api.",
            {"Ref": "AWS::Region"},
            ".amazonaws.com/",
            {"Fn::GetAtt":["StageName","Name"]}
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
},
"StageName":{
    "Type": "Custom::Variable",
    "Properties": {
        "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
        "Name":"api"
    }
}
}
