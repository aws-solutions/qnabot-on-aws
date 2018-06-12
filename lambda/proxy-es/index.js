var Url=require('url')
var Promise=require('bluebird')
var cfnLambda=require('cfn-lambda')
var request=require('./lib/request')

exports.qid=require('./lib/qid')
exports.logging=require('./lib/logging')
exports.cleanmetrics=require('./lib/cleanmetrics')
exports.utterances=require('./lib/utterances')
exports.handler =require('./lib/handler') 
exports.resource=require('./lib/cfn').resource

exports.query=function(event,context,callback){
    require('./lib/query')(event.req,event.res)
    .then(()=>callback(null,event)) 
    .catch(callback)
}


