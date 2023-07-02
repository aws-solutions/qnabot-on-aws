var fs=require('fs')
var _=require('lodash')

module.exports= {
    KendraWebCrawlerLambdaArn: {
        Value: {"Fn::GetAtt": ["KendraNativeCrawlerLambda", "Arn"]}
    }
}