var Url=require('url')
var Promise=require('bluebird')
var cfnLambda=require('cfn-lambda')
var request=require('./lib/request')

exports.qid=require('./lib/qid')

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    request({
        url:Url.resolve("https://"+event.endpoint,event.path),
        method:event.method,
        body:event.body 
    })
    .tap(x=>console.log(JSON.stringify(x)))
    .tapCatch(x=>console.log(x))
    .then(result=>callback(null,result))
    .catch(error=>callback(JSON.stringify({
        type:"[InternalServiceError]",
        status:error.response.status,
        message:error.response.statusText,
        data:error.response.data
    })))
}

exports.resource=require('./lib/cfn').resource

exports.query=function(event,context,callback){
    require('./lib/query')(event.req,event.res)
    .then(()=>callback(null,event)) 
    .catch(callback)
}


