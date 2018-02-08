var Url=require('url')
var Promise=require('bluebird')
var cfnLambda=require('cfn-lambda')
var request=require('./request')

exports.Create=function(params,reply){
    try{
        exports.handler(params.create,null,function(err,data){
            err ? reply(JSON.stringify(err)) : reply(null,"es")
        })
    }catch(e){
        console.log(e)
        reply(e)
    }
}
exports.Update=function(ID,params,oldparams,reply){
    exports.Create(params,reply) 
}
exports.Delete=function(ID,params,reply){
    if(params.delete){
        exports.handler(params.delete,null,function(err,data){
            err ? reply(JSON.stringify(err)) : reply(null,"es")
        })
    }else{
        reply(null,ID)
    }
}

exports.resource=cfnLambda({
    Create:exports.Create,
    Update:exports.Update,
    Delete:exports.Delete
})


