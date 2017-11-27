var base=require('./base')
var Promise=require('bluebird')
var cfExports=require('../../bin/exports')

var setup=cfExports.then(function(exports){
    process.env.USERPOOL=exports["ENVOY-COGNITO-USERPOOL"]
    process.env.CLIENT=exports["ENVOY-COGNITO-CLIENT"]
    
    var param={
        LoginCallbackUrl:"https://localhost/login",
        LogoutCallbackUrl:"https://localhost/login"
    }
    return param
})

exports.create=()=>params("Create")
exports.update=()=>params("Update")
exports.delete=()=>params("Delete")

function params(stage){
    return setup.then(param=>base("CognitoLogin",stage,param))
}
