var fs=require('fs')
var _=require('lodash')
var lambdas=require('./lambdas')
var elasticsearch=require('./elasticsearch')
var util=require('./util')

module.exports=function(offset){
    var title=util.Title("## Lex ",offset)
    var lex=[{
        "type": "metric",
        "properties": {
            "view": "timeSeries",
            "stacked": false,
            "metrics": [
                [ "AWS/Lex", "MissedUtteranceCount", "BotVersion", "$LATEST", "Operation", "PostText", "BotName", "${Bot}" ],
                [ ".", "RuntimeSucessfulRequestLatency", ".", ".", ".", ".", ".", ".", { "yAxis": "right" } ],
                [ ".", "RuntimeRequestCount", ".", ".", ".", ".", ".", "." ]
            ],
            "region": "${AWS::Region}",
            "title": "Lex Utterances/Latency"
        }
    }]
    return _.flatten([title,lex.map(util.place(offset+title.height))])
}
