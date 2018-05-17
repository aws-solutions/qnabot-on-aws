var cfnLambda=require('cfn-lambda')
var response=require('./lib/util/response')
var _=require('lodash')

exports.handler=function(event,context,cb){
    dispatch(event,context,cb)
}

var targets={
    CognitoRole:require('./lib/CognitoRole'),
    CognitoLogin:require('./lib/CognitoLogin'),
    CognitoDomain:require('./lib/CognitoDomain'),
    CognitoUrl:require('./lib/CognitoUrl'),
    S3Clear:require('./lib/S3Clear'),
    S3Version:require('./lib/S3Version'),
    S3Lambda:require('./lib/S3Lambda'),
    S3Unzip:require('./lib/S3Unzip'),
    Variable:require('./lib/Variable'),
    ApiCompression:require('./lib/ApiCompression'),
    ApiDeployment:require('./lib/ApiDeployment'),
    ElasticSearchUpdate:require('./lib/ElasticSearchUpdate'),
    ESCognitoClient:require('./lib/ESCognitoClient'),
    Kibana:require('./lib/kibana'),
}
var Lex=require('./lib/lex')

function dispatch(event,context,cb){
    console.log("event",JSON.stringify(event,null,2))
    var type=event.ResourceType.match(/Custom::(.*)/)
    var Lextype=event.ResourceType.match(/Custom::Lex(Bot|Alias|SlotType|Intent)/)
    if(_.get(Lextype,1)==='Alias') Lextype[1]='BotAlias'
    console.log(targets[type[1]]) 
    
    if(Lextype){ 
        cfnLambda(new Lex(Lextype[1]))(event,context,cb)
    }else if(targets[type[1]]){
        return cfnLambda(new targets[type[1]])(event,context,cb)
    }else{
        response.send({
            event, 
            context, 
            reason:"Invalid resource type:"+event.ResourceType,
            responseStatus:response.FAILED
        })
        .then(()=>cb("Invalid resource type:"+event.ResourceType))
        .catch(cb)
    }
}

