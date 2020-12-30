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
    PreUpgradeExport:require('./lib/PreUpgradeExport'),
    PostUpgradeImport:require('./lib/PostUpgradeImport'),
    Kibana:require('./lib/base'),  // Kibana custom resource deprecated.. preserve entry here to avoid resource delete failure on stack upgrade.
}
var Lex=require('./lib/lex')

function dispatch(event,context,cb){
    console.log("event",JSON.stringify(event,null,2))
    var type=event.ResourceType.match(/Custom::(.*)/)
    var Lextype=event.ResourceType.match(/Custom::Lex(Bot|Alias|SlotType|Intent)/)
    if(_.get(Lextype,1)==='Alias') Lextype[1]='BotAlias'
    console.log(targets[type[1]]) 
    
    if(Lextype){
        /* change to fix 4.4.0 installs where QNAPin and QNAPinNoConfirm elicit response bots inadvertently included a
         * bad character in clarificationPrompt and rejectionStatement which would break further updates.
        */
        if (_.has(event,"OldResourceProperties.clarificationPrompt.messages[0].content")) {
            let v = _.get(event, "OldResourceProperties.clarificationPrompt.messages[0].content", "");
            if (v.includes("I’m")) {
                console.log('found bad apostrophe and replacing');
                v = v.replace("I’m", "I'm");
                _.set(event, "OldResourceProperties.clarificationPrompt.messages[0].content", v);
            }
        }
        if (_.has(event,"OldResourceProperties.rejectionStatement.messages[0].content")) {
            let v =_.get(event, "OldResourceProperties.rejectionStatement.messages[0].content", "");
            if (v.includes("I’m")) {
                console.log('found bad apostrophe and replacing');
                v = v.replace("I’m","I'm");
                _.set(event, "OldResourceProperties.rejectionStatement.messages[0].content", v);
            }
        }
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

