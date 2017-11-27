var base=require('./base')
var Promise=require('bluebird')
var cfExports=require('../../bin/exports')

var setup=cfExports.then(function(exports){
    var param={
        UserPool:exports["QNA-DEV-USERPOOL"],
        ClientId:exports["QNA-DEV-CLIENT"],
        LoginCallbackUrls:["https://localhost/login"],
        LogoutCallbackUrls:["https://localhost/login"]
    }
    return param
})

exports.create=()=>params("Create")
exports.update=()=>params("Update")
exports.delete=()=>params("Delete")

function params(stage){
    return setup.then(param=>base("CognitoLogin",stage,param))
}
