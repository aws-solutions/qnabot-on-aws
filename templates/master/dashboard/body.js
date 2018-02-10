var fs=require('fs')
var _=require('lodash')

var files=fs.readdirSync(`${__dirname}/..`)
    .filter(x=>!x.match(/README.md|Makefile|dashboard|index|test/))
    .map(x=>require(`../${x}`))
    
var lambdas={}
_.forEach(_.assign.apply({},files),(value,key)=>{
    if(value.Type==='AWS::Lambda::Function' && key!=="ESInfoLambda"){
        var type=_.fromPairs(value.Properties.Tags.map(x=>[x.Key,x.Value])).Type
        if(!lambdas[type]){
            lambdas[type]=[]
        }
        lambdas[type].push(key)
    }
})

var misc=[
{
    "type": "metric",
    "properties": {
        "view": "timeSeries",
        "stacked": false,
        "metrics": [
            [ "AWS/ApiGateway", "Latency", "ApiName", "${AWS::StackName}" ],
            [ ".", "4XXError", ".", ".", { "yAxis": "right" } ]
        ],
        "region": "${AWS::Region}",
        "title": "API GateWay Latency,Errors"
    }
},
{
    "type": "metric",
    "properties": {
        "view": "timeSeries",
        "stacked": false,
        "metrics": [
            [ "AWS/ES", "FreeStorageSpace", "DomainName", "${ESVar.ESDomain}", "ClientId", "${AWS::AccountId}", { "period": 60 } ],
            [ ".", "SearchableDocuments", ".", ".", ".", ".", { "yAxis": "right", "period": 60 } ]
        ],
        "region": "${AWS::Region}",
        "title": "ElasticSearch Documents/FreeSpace"
    }
},
{
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
var Main_title=Title("# QnABot:${AWS::StackName} Dashboard",0)

var misc_widgets=misc.map(place(Main_title.height))

var Lambda_title=Title("## Lambda Function",Math.max(...misc_widgets.map(x=>x.y))+6)

var lambda_widgets=_.map(lambdas,(value,key)=>{
    return {list:value.map(lambda),name:key}
}).reduce((accumulation,current)=>{
    var title=Title(`### ${current.name}`,accumulation.offset)
    accumulation.offset+=title.height
    accumulation.list.push(title)
    
    current.list.map(place(accumulation.offset))     
        .forEach(x=>{accumulation.list.push(x)})

    accumulation.offset=Math.max(...accumulation.list.map(x=>x.y))+6
    return accumulation
},{list:[],offset:Math.max(...misc_widgets.map(x=>x.y))+6+Lambda_title.height})

module.exports={widgets:_.flatten([
    Main_title,misc_widgets,Lambda_title,_.flatten(lambda_widgets.list)
])}

function place(yOffset){
    return (value,index,collection)=>{
        value.height=6
        value.width=6
        value.x=(index % (24/6))*6
        value.y=(Math.floor(index / (24/6))*6)+yOffset
        return value
    }
}

function lambda(name){
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

function Title(text,offset){
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
