var fs=require('fs')
var _=require('lodash')
var util=require('./util')
var lambdas=require('./lambdas')

module.exports=function(offset){
    var title=util.Title('## ElasticSearch',offset)
    var widgets=[
        {
            "type": "metric",
            "width": 6,
            "height": 6,
            "properties": {
                "view": "timeSeries",
                "stacked": false,
                "metrics": [
                    [ "AWS/ES", "ReadLatency", "DomainName", "${ESVar.ESDomain}", "ClientId", "${AWS::AccountId}" ]
                ],
                "region": "${AWS::Region}"
            }
        },
        {
            "type": "metric",
            "width": 6,
            "height": 6,
            "properties": {
                "view": "timeSeries",
                "stacked": false,
                "metrics": [
                    [ "AWS/ES", "ReadIOPS", "DomainName", "${ESVar.ESDomain}", "ClientId", "${AWS::AccountId}" ],
                    [ ".", "ReadThroughput", ".", ".", ".", ".", { "yAxis": "right" } ]
                ],
                "region": "${AWS::Region}"
            }
        },
        {
            "type": "metric",
            "width": 6,
            "height": 6,
            "properties": {
                "view": "timeSeries",
                "stacked": false,
                "metrics": [
                    [ "AWS/ES", "CPUUtilization", "DomainName", "${ESVar.ESDomain}", "ClientId", "${AWS::AccountId}" ]
                ],
                "region": "${AWS::Region}"
            }
        },
        {
            "type": "metric",
            "x": 18,
            "y": 0,
            "properties": {
                "view": "timeSeries",
                "stacked": false,
                "metrics": [
                    [ "AWS/ES", "ClusterUsedSpace", "DomainName", "${ESVar.ESDomain}", "ClientId", "${AWS::AccountId}" ],
                    [ ".", "SearchableDocuments", ".", ".", ".", ".", { "yAxis": "right" } ]
                ],
                "region": "${AWS::Region}"
            }
        },
        {
            "type": "metric",
            "width": 6,
            "height": 6,
            "properties": {
                "view": "timeSeries",
                "stacked": false,
                "metrics": [
                    [ "AWS/ES", "ClusterStatus.green", "DomainName", "${ESVar.ESDomain}", "ClientId", "${AWS::AccountId}", { "color": "#2ca02c" } ],
                    [ ".", "ClusterStatus.red", ".", ".", ".", ".", { "color": "#d62728" } ],
                    [ ".", "ClusterStatus.yellow", ".", ".", ".", ".", { "color": "#bcbd22" } ]
                ],
                "region": "${AWS::Region}"
            }
        }
    ].map(util.place(offset+title.height))
    
    return _.flatten([title,widgets])
}
