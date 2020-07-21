var date=new Date()
module.exports={
"Var":{
    "Type": "Custom::Variable",
    "Properties": {
        "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
        "index":{
            value:{"Ref":"AWS::StackName"},
            op:"toLowerCase"
        },
        "QnAType":"qna",
        "QuizType":"quiz",
        "QnaIndex":{
            value:{"Fn::Sub":"${AWS::StackName}"},
            op:"toLowerCase"
        },
        "MetricsIndex":{
            value:{"Fn::Sub":"${AWS::StackName}-metrics"},
            op:"toLowerCase"
        },
        "FeedbackIndex":{
            value:{"Fn::Sub":"${AWS::StackName}-feedback"},
            op:"toLowerCase"
        },
    }
},
"InfoVar":{
    "Type": "Custom::Variable",
    "Properties": {
        "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
        "Version":require('../../package.json').version,
        "BuildDateString":`${date.toDateString()} ${date.toTimeString()}`,
        "BuildDate":date
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
        ]]},
        "Kibana":{"Fn::Sub":"${ESVar.ESAddress}/_plugin/kibana/"}
    }
}
}
