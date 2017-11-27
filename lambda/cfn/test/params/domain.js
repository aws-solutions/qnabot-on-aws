var base=require('./base')
var Promise=require('bluebird')
var cfExports=require('../../bin/exports')

var setup=cfExports.then(function(exports){
    var param={
        UserPool:exports["QNA-DEV-USERPOOL"],
        Client:exports["QNA-DEV-CLIENT"],
        LoginRedirectUrl:"https://exampe.com",
        LogoutRedirectUrl:"https://exampe.com" 
    }
    return param
})

exports.create=()=>params("Create")
exports.update=()=>params("Update")
exports.delete=()=>params("Delete")

function params(stage){
    return setup.then(param=>base("CognitoDomain",stage,param))
}
