var cfnLambda=require('cfn-lambda')
var response=require('./lib/util/response')
var _=require('lodash')

exports.handler=function(event,context,cb){
    console.log(event)
    dispatch(event,context,cb)
}

var targets={
    CognitoRole:require('./lib/CognitoRole'),
    CognitoLogin:require('./lib/CognitoLogin'),
    CognitoDomain:require('./lib/CognitoDomain'),
    CognitoUrl:require('./lib/CognitoUrl'),
    S3Clear:require('./lib/S3Clear'),
    S3Unzip:require('./lib/S3Unzip'),
    Variable:require('./lib/Variable'),
    EsInit:require('./lib/es')
}
var Lex=require('./lib/lex')

function dispatch(event,context,cb){
    var type=event.ResourceType.match(/Custom::(.*)/)
    var Lextype=event.ResourceType.match(/Custom::Lex(Bot|Alias|SlotType|Intent)/)
    if(_.get(Lextype,1)==='Alias') Lextype[1]='BotAlias'
    
    if(Lextype){ 
        cfnLambda(new Lex(Lextype[1]))(event,context,cb)
    }else if(targets[type[1]]){
        return cfnLambda(new targets[type[1]])(event,context,cb)
    }else{
        response.send({
            event, 
            context, 
            reason:"Invalid resource type:"+event.ResourceType,
            responseStatus:response.FAIL
        })
        .then(()=>cb("Invalid resource type:"+event.ResourceType))
        .catch(cb)
    }
}

