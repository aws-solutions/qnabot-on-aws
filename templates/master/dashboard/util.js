exports.yOffset=function(widgets){
    var start=Math.max(...widgets.map(x=>x.y))
    var height=Math.max(...widgets.filter(x=>x.y===start).map(x=>x.height))
    return start+height+1
}

exports.place=function(yOffset){
    return (value,index,collection)=>{
        value.height=6
        value.width=6
        value.x=(index % (24/6))*6
        value.y=(Math.floor(index / (24/6))*6)+yOffset
        return value
    }
}

exports.lambda=function(name){
    return {
        "type": "metric",
        "properties": {
            "view": "timeSeries",
            "stacked": false,
            "metrics": [
                [ "AWS/Lambda", "Errors", "FunctionName", "${"+name+"}", { "stat": "Sum" } ],
                [ ".", "Invocations", ".", ".", { "stat": "Sum" } ],
                [ ".", "Duration", ".", ".", { "yAxis": "right" } ],
                [ ".", "Throttles", ".", ".", { "stat": "Sum" } ]
            ],
            "region": "${AWS::Region}",
            "title": name,
            "period": 300
        }
    }
}

exports.Title=function(text,offset){
    return {
        "type": "text",
        "width": 24,
        "height": 2,
        "x":0,
        "y":offset,
        "properties": {
            "markdown":text
        }
    }
}
