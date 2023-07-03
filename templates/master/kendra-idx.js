module.exports={
    // conditionally create Kendra index
    "KendraIndexStack":{
        "Type" : "AWS::CloudFormation::Stack",
        "Condition" : "CreateKendraIndex",
        "Properties" : {
            "TemplateURL" :{"Fn::Sub":"https://${BootstrapBucket}.s3.${AWS::Region}.amazonaws.com/${BootstrapPrefix}/templates/kendra-index.yaml"},
            "Parameters" :{
                "IndexName":{"Ref":"AWS::StackName"},
                "IndexEdition":{"Ref":"CreateKendraIndex"}
            }
        }
    },
    // Conditionally start Kendra web crawler.. depends on DefaultQnABotSettings
    "StartKendraWebCrawler":{
        "Type": "Custom::StartKendraWebCrawler",
        "Condition": "RunKendraWebCrawler",
        "DependsOn": "DefaultQnABotSettings",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["ExportStack", "Outputs.KendraWebCrawlerLambdaArn"] },
            // invoke if any of the following params change
            "KendraIndexId": {"Fn::If": [
                "CreateKendraIndex", 
                {"Fn::GetAtt": ["KendraIndexStack", "Outputs.KendraIndexId"]}, 
                {"Ref": "DefaultKendraIndexId"}
            ]},
            "KendraWebCrawlerURLs": { "Ref": "KendraWebCrawlerURLs"},
            "KendraWebCrawlerDepth": { "Ref": "KendraWebCrawlerDepth"},
        }
    },
}