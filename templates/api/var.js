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
