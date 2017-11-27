var base=require('./base')
var Promise=require('bluebird')
var cfExports=require('../../bin/exports')

var setup=cfExports.then(function(exports){
    process.env.USERPOOL=exports["QNA-COGNITO-USERPOOL"]
    process.env.CLIENT=exports["QNA-COGNITO-CLIENT"]
    
    var param={
        LoginRedirectUrl:"https://exampe.com",
        LogoutRedirectUrl:"https://exampe.com",
        Domain:"example.com",
        UserPool:"userpool"
    }
    return param
})

exports.create=()=>params("Create")
exports.update=()=>params("Update")
exports.delete=()=>params("Delete")

function params(stage){
    return setup.then(param=>base("CognitoUrl",stage,param))
}
