var cfnLambda=require('cfn-lambda')
var response=require('./lib/util/response')

exports.handler=function(event,context,cb){
    console.log(event)
    dispatch(event,context,cb)
}

var targets={
    CognitoUser:require('./lib/CognitoUser'),
    CognitoRole:require('./lib/CognitoRole'),
    CognitoLogin:require('./lib/CognitoLogin'),
    CognitoDomain:require('./lib/CognitoDomain'),
    CognitoUrl:require('./lib/CognitoUrl'),
    CloudDir:require('./lib/CloudDir'),
    CloudDirObject:require('./lib/CloudDirObject'),
    CloudDirIndex:require('./lib/CloudDirIndex'),
    S3Clear:require('./lib/S3Clear'),
    S3Unzip:require('./lib/S3Unzip'),
    Registration:require('./lib/Register'),
    Token:require('./lib/Token'),
    TokenDecode:require('./lib/TokenDecode'),
    Random:require('./lib/Random'),
    Variable:require('./lib/Variable')
}

function dispatch(event,context,cb){
    var type=event.ResourceType.match(/Custom::(.*)/)
    if(targets[type[1]]){
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

