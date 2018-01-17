var base=require('./base')
var Promise=require('bluebird')
var outputs=require('../../../../bin/exports')

var setup=outputs('dev/cognito').then(function(output){
    process.env.USERPOOL=output.UserPool
    process.env.CLIENT=output.Client
    
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
