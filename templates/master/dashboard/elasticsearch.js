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
                    [ "AWS/ES", "ReadLatency", "DomainName", "${ESVar.ESDomain}", "ClientId", "613341023709" ]
                ],
                "region": "us-east-1"
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
                    [ "AWS/ES", "ReadIOPS", "DomainName", "${ESVar.ESDomain}", "ClientId", "613341023709" ],
                    [ ".", "ReadThroughput", ".", ".", ".", ".", { "yAxis": "right" } ]
                ],
                "region": "us-east-1"
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
                    [ "AWS/ES", "CPUUtilization", "DomainName", "${ESVar.ESDomain}", "ClientId", "613341023709" ]
                ],
                "region": "us-east-1"
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
                    [ "AWS/ES", "ClusterUsedSpace", "DomainName", "${ESVar.ESDomain}", "ClientId", "613341023709" ],
                    [ ".", "SearchableDocuments", ".", ".", ".", ".", { "yAxis": "right" } ]
                ],
                "region": "us-east-1"
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
                    [ "AWS/ES", "ClusterStatus.green", "DomainName", "${ESVar.ESDomain}", "ClientId", "613341023709", { "color": "#2ca02c" } ],
                    [ ".", "ClusterStatus.red", ".", ".", ".", ".", { "color": "#d62728" } ],
                    [ ".", "ClusterStatus.yellow", ".", ".", ".", ".", { "color": "#bcbd22" } ]
                ],
                "region": "us-east-1"
            }
        }
    ].map(util.place(offset+title.height))
    
    return _.flatten([title,widgets])
}
